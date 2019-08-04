export const formatDate = timestamp => {
	const d = new Date(timestamp);
	let m = d.getMonth() + 1;
	if (m < 10) {
		m = "0" + m;
	}
	return `${d.getFullYear()}-${m}-${d.getDate()}T${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}Z`;
};

export const sortByTimestamp = (arr, dir) => {
	if (dir === "asc") {
		return arr.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
	} else {
		return arr.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
	}
};

// return arrays of datatypes to subscribe/unsubscribe
export const getSubscribeTypes = tbody => {
	const subscribeTypes = [];
	const unsubscribeTypes = [];

	// populate arrays based on data types in populated rows
	if (!tbody.rows.length) {
		unsubscribeTypes.push("pwr.v", "pwr.c");
	} else if (tbody.rows.length === 1) {
		let type = tbody.rows[0].querySelector("td.id").innerText;
		subscribeTypes.push(type);
		unsubscribeTypes.push(type === "pwr.v" ? "pwr.c" : "pwr.v");
	} else {
		subscribeTypes.push("pwr.v", "pwr.c");
	}
	return [subscribeTypes, unsubscribeTypes];
};
