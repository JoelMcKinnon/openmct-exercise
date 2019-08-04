# openmct-exercise

Demo of an SPA that connects to and displays data from an MCT telemetry server.

### To run the applications:

You will need to have the open-mct tutorial server up and running. Instructions for download and setup as follows:

`git clone ​https://github.com/nasa/openmct-tutorial.git`  
`cd openmct-tutorial`  
`npm install`  
`npm start`

**Telemetry app should be running on localhost:8080.**

Next, clone this repository and follow the steps below:

`git clone https://github.com/JoelMcKinnon/openmct-exercise.git`  
`cd openmct-exercise`  
`npm install`  
`nodemon index`

**Exercise app should be running on localhost:4000.**

You should see a small form and a row of table headers for ID, Timestamp and Value. The radio buttons allow selection of sort order descending or ascending by timestamp, with a default of descending. Clicking on the _Get Telemetry_ button will populate the table with the three columns of data received from the telemetry server. The time range is set to the fifteen minutes preceding the current moment.

To select a subset of the data, click and hold the mouse down on any row, then drag up or down to select a range. Upon releasing the mouse, the selected rows will remain while all others are removed from the table. The web socket to the realtime telemetry server will open for all datatypes represented among the selected rows. If the data is sorted in descending order, then new rows will continuously appear prepended to the table. If the data is sorted in ascending order, the new rows will be appended below the selected rows.

Clicking on the _Get Telemetry_ button at any time will repopulate the table with data for the full fifteen minute range up to the moment it is clicked. Ideally, this should also close any open web sockets, but I'm still unable to get that to happen, so a page reload is necessary for that purpose.

Please contact the author at joelmckinnon@icloud.com with any questions.
