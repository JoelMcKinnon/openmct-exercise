const express = require("express");
const axios = require("axios");

const app = express();

const server = app.listen(4000, () => {
	console.log("listening to requests on port 4000");
});

app.use(express.static("public"));

const now = new Date().getTime();
const startTime = now - 900000;
const endTime = now;

axios
	.all([
		axios.get(
			`http://localhost:8080/history/pwr.c?start=${startTime}&end=${endTime}`
		),
		axios.get(
			`http://localhost:8080/history/pwr.v?start=${startTime}&end=${endTime}`
		)
	])
	.then(
		axios.spread((cResp, vResp) => {
			app.get("/history", (req, res) => {
				res.send(cResp.data.concat(vResp.data));
			});
		})
	);
