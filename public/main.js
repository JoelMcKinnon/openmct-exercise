window.addEventListener("load", event => {
	const initControlsForm = () => {
		const form = document.querySelector("#controls");
		form.addEventListener("submit", event => {
			event.preventDefault();
			const sortOrder = document.querySelector(
				`input[name="sort_order"]:checked`
			).value;
			wsConnection = false;
			populateTableRows(sortOrder);
		});
	};

	initControlsForm();
});

function populateTableRows(sortOrder) {
	const histTable = document.querySelector("#history");

	if (histTable.querySelector("tbody")) {
		histTable.querySelector("tbody").remove();
	}
	const histBody = document.createElement("tbody");
	histTable.append(histBody);

	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = () => {
		if (xhr.readyState === 4 && xhr.status === 200) {
			const histArr = JSON.parse(xhr.responseText);
			sortHistArr(histArr, sortOrder);
			histArr.forEach(item => renderRow(histBody, item));

			let selectedRange = [];
			let isSelecting = false;
			histBody.addEventListener("mousedown", event => {
				selectedRange.push(event.target.parentElement.rowIndex);
				event.target.parentElement.classList.add("selected");
				isSelecting = true;
			});
			histBody.addEventListener("mousemove", event => {
				if (isSelecting) {
					event.target.parentElement.classList.add("selected");
				}
			});
			histBody.addEventListener("mouseup", event => {
				selectedRange.push(event.target.parentElement.rowIndex);
				isSelecting = false;
				removeUnselectedRows(histBody, selectedRange);
				window.getSelection().removeAllRanges();
				if (histBody.rows.length === 1) {
					const type = histBody.rows[0].querySelector("td.id").innerText;
					subscribeSelections(histBody, sortOrder, type);
				} else {
					subscribeSelections(histBody, sortOrder);
				}
				unsubscribeSelections(histBody);
			});
		}
	};
	xhr.open("GET", "history/");
	xhr.send();
}

function unsubscribeSelections(tbody) {
	let pwrVSelected = false;
	let pwrCSelected = false;
	for (let row of tbody.rows) {
		if (row.firstChild.innerText === "pwr.v") {
			pwrVSelected = true;
		} else if (row.firstChild.innerText === "pwr.c") {
			pwrCSelected = true;
		}
		if (pwrVSelected && pwrCSelected) break;
	}

	if (!pwrVSelected || !pwrCSelected) {
		const ws = new WebSocket("ws://localhost:8080/realtime");
		ws.onopen = event => {
			wsConnection = true;
			if (!pwrVSelected) {
				ws.send("unsubscribe pwr.v");
			}
			if (!pwrCSelected) {
				ws.send("unsubscribe pwr.c");
			}
			if (!pwrVSelected && !pwrCSelected) {
				ws.close();
			}
		};
	}
}

function subscribeSelections(tbody, sortOrder, type) {
	const ws = new WebSocket("ws://localhost:8080/realtime");
	ws.onopen = event => {
		wsConnection = true;
		if (type !== undefined) {
			ws.send(`subscribe ${type}`);
		} else {
			ws.send("subscribe pwr.v");
			ws.send("subscribe pwr.c");
		}
	};
	ws.onmessage = function(event) {
		renderRow(tbody, JSON.parse(event.data), sortOrder);
	};

	ws.onerror = error => {
		console.log(`WebSocket error: ${error.toString()}`);
	};
}

function renderRow(tbody, data, sortOrder) {
	let newRow = document.createElement("tr");
	let idCell = document.createElement("td");
	let tsCell = document.createElement("td");
	let valCell = document.createElement("td");
	idCell.innerText = data.id;
	tsCell.innerText = formatDate(data.timestamp);
	valCell.innerText = data.value;
	newRow.append(idCell, tsCell, valCell);
	idCell.classList.add("id");
	if (sortOrder) {
		if (sortOrder === "asc") {
			tbody.append(newRow);
		} else {
			tbody.insertBefore(newRow, tbody.firstChild);
		}
	} else {
		tbody.append(newRow);
	}
}

function sortHistArr(arr, dir) {
	if (dir === "asc") {
		return arr.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
	} else {
		return arr.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
	}
}

function removeUnselectedRows(tableBody, range) {
	const rowTotal = tableBody.rows.length;
	// delete all rows after selection
	for (let i = range[1] + 1; i < rowTotal + 1; i++) {
		tableBody.deleteRow(tableBody.rows.length - 1);
	}
	// delete all rows before selection
	if (tableBody.rows.length !== 1) {
		for (let i = 0; i < range[0] - 1; i++) {
			tableBody.deleteRow(0);
		}
	}
	Array.from(tableBody.rows).forEach(row => {
		row.classList.remove("selected");
	});
}

function formatDate(ts) {
	const d = new Date(ts);
	let m = d.getMonth() + 1;
	if (m < 10) {
		m = "0" + m;
	}
	return `${d.getFullYear()}-${m}-${d.getDate()}T${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}Z`;
}
