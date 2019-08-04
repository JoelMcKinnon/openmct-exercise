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

	// close any open socket connection before getting new telemetry (JOEL: hits ws.close() on line 105 but does not close socket)
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

// config controls form to activate table render
const form = document.querySelector("#controls");
const sortOrder = document.querySelector(`input[name="sort_order"]:checked`)
	.value;

// define submit action
form.addEventListener("submit", event => {
	event.preventDefault();
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

	// open socket and subscribe/unsubscribe as needed
	ws.onopen = event => {
		if (tbody.rows.length === 0) {
			ws.close();
			return;
		}
		getSubscribeTypes(tbody)[0].forEach(dataType => {
			ws.send(`subscribe ${dataType}`);
		});
		getSubscribeTypes(tbody)[1].forEach(dataType => {
			ws.send(`unsubscribe ${dataType}`);
		});
	};

	// render new rows for all new data received
	ws.onmessage = function(event) {
		renderRow(tbody, JSON.parse(event.data), sortOrder);
	};

	ws.onerror = error => {
		console.log(`WebSocket error: ${error.toString()}`);
	};
}
