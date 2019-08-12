import { formatDate, sortByTimestamp, getSubscribeTypes } from "./utils.js";

// get telemetry data and render rows with data returned
const populateTableRows = sortOrder => {
	const histTable = document.querySelector("#history");

	// clear existing rows in table if present
	if (histTable.querySelector("tbody")) {
		histTable.querySelector("tbody").remove();
	}
	const tbody = document.createElement("tbody");
	histTable.append(tbody);

	// close any open socket connection before getting new telemetry
	modifySubscriptions(tbody, sortOrder);

	// get history telemetry
	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = () => {
		if (xhr.readyState === 4 && xhr.status === 200) {
			const dataArr = JSON.parse(xhr.responseText);

			// sort received telemetry by timestamp
			sortByTimestamp(dataArr, sortOrder);

			// render rows with telemetry
			dataArr.forEach(item => renderRow(tbody, item));

			// add listeners and actions for selecting rows
			selectRows(tbody, sortOrder);
		}
	};
	xhr.open("GET", "history/");
	xhr.send();
};

// define submit action capturing checked value for sort_order
document.querySelector("#controls").addEventListener("submit", event => {
	event.preventDefault();
	const sortOrder = document.querySelector('input[name="sort_order"]:checked')
		.value;
	populateTableRows(sortOrder);
});

// add listeners to constrain selections on mouse actions
function selectRows(tbody, sortOrder) {
	let selectedRange = [];
	let isSelecting = false;

	// listener to select start row for selections
	tbody.addEventListener("mousedown", event => {
		selectedRange.push(event.target.parentElement.rowIndex);
		event.target.parentElement.classList.add("selected");
		isSelecting = true;
	});

	// listener to style selected rows
	tbody.addEventListener("mousemove", event => {
		if (isSelecting) {
			event.target.parentElement.classList.add("selected");
		}
	});

	// listener to add selected rows for real-time telemetry
	// and remove and unsubscribe deselected rows
	tbody.addEventListener("mouseup", event => {
		isSelecting = false;
		selectedRange.push(event.target.parentElement.rowIndex);
		removeUnselectedRows(tbody, selectedRange);

		// remove text focus from selected rows
		window.getSelection().removeAllRanges();

		// subscribe to selected rows
		modifySubscriptions(tbody, sortOrder);
	});
}

// render a new row from telemetry data
function renderRow(tbody, data, sortOrder) {
	let newRow = document.createElement("tr");
	newRow.innerHTML = `
		<td class="id">${data.id}</td>
		<td>${formatDate(data.timestamp)}</td>
		<td>${data.value}</td>`;
	if (sortOrder && sortOrder === "desc") {
		tbody.insertBefore(newRow, tbody.firstChild);
	} else {
		tbody.append(newRow);
	}
}

function renderDoubleRow(tbody, dataArr, sortOrder) {
	let newRows = document.createDocumentFragment();
	let newRow1 = document.createElement("tr");
	let newRow2 = document.createElement("tr");
	newRow1.innerHTML = `
		<td class="id">${dataArr[0].id}</td>
		<td>${formatDate(dataArr[0].timestamp)}</td>
		<td>${dataArr[0].value}</td>
	`;
	newRow2.innerHTML = `
		<td class="id">${dataArr[1].id}</td>
		<td>${formatDate(dataArr[1].timestamp)}</td>
		<td>${dataArr[1].value}</td>
	`;
	newRows.appendChild(newRow1);
	newRows.appendChild(newRow2);
	if (sortOrder && sortOrder === "desc") {
		tbody.insertBefore(newRows, tbody.firstChild);
	} else {
		tbody.append(newRows);
	}
}

// delete rows outside of selection range
function removeUnselectedRows(tbody, range) {
	const rowTotal = tbody.rows.length;

	// delete all rows after selection
	for (let i = range[1] + 1; i < rowTotal + 1; i++) {
		tbody.deleteRow(tbody.rows.length - 1);
	}

	// delete all rows before selection
	if (tbody.rows.length !== 1) {
		for (let i = 0; i < range[0] - 1; i++) {
			tbody.deleteRow(0);
		}
	}

	// remove selected style from all rows
	Array.from(tbody.rows).forEach(row => {
		row.classList.remove("selected");
	});
}

// do all websocket operations
function modifySubscriptions(tbody, sortOrder) {
	const ws = new WebSocket("ws://localhost:8080/realtime");
	const now = new Date().getTime();
	const subscribeTypes = getSubscribeTypes(tbody)[0];
	const unsubscribeTypes = getSubscribeTypes(tbody)[1];
	const dataArr = [];

	// open socket and subscribe/unsubscribe as needed
	ws.onopen = event => {
		if (tbody.rows.length === 0) {
			ws.close();
			return;
		}
		subscribeTypes.forEach(dataType => {
			ws.send(`subscribe ${dataType}`);
		});
		unsubscribeTypes.forEach(dataType => {
			ws.send(`unsubscribe ${dataType}`);
		});
	};

	// render new rows for all new data received
	ws.onmessage = function(event) {
		const timeStamp = JSON.parse(event.data).timestamp;
		const timeLimit = 300000; // 5 min

		// limit rows displayed to timeLimit
		if (timeStamp - now > timeLimit) {
			if (sortOrder === "asc") {
				tbody.deleteRow(tbody.firstChild);
			} else {
				tbody.removeChild(tbody.lastChild);
			}
		}
		// render single row
		if (subscribeTypes.length === 1) {
			renderRow(tbody, JSON.parse(event.data), sortOrder);
		} else {
			// render double row
			dataArr.push(JSON.parse(event.data));
			if (dataArr.length === 2) {
				renderDoubleRow(tbody, dataArr, sortOrder);
				dataArr.length = 0;
			}
		}

		if (sortOrder === "asc") {
			// scroll to bottom of document
			window.scrollTo(0, document.body.scrollHeight);
			// tbody.lastChild.scrollIntoView();
		}
	};

	ws.onerror = error => {
		console.log(`WebSocket error: ${error.toString()}`);
	};
}
