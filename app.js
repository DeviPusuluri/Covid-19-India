const express = require("express");
const path = require("path");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;
app.use(express.json());
const databasePath = path.join(__dirname, "covid19India.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server is running successfully at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DBError:${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertStateObjectToDbObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

// API1
app.get("/states/", async (request, response) => {
  const getQueryState = `
    SELECT * FROM state;`;
  const statesQuery = await db.all(getQueryState);
  response.send(statesQuery.map((i) => convertStateObjectToDbObject(i)));
});

// API2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `
    SELECT * FROM state
    WHERE state_id=${stateId};`;
  const getStateId = await db.get(getStateIdQuery);
  response.send(convertStateObjectToDbObject(getStateId));
});

// API3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

// API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district
    WHERE district_id=${districtId}`;
  const districtData = await db.get(getDistrictQuery);
  response.send({
    districtId: districtData.district_id,
    districtName: districtData.district_name,
    stateId: districtData.state_id,
    cases: districtData.cases,
    cured: districtData.cured,
    active: districtData.active,
    deaths: districtData.deaths,
  });
});
// API5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id=${districtId}`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

const convertDistrictObjectToDbObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
// API6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE district 
    SET  district_name='${districtName}',
            state_id=${stateId},
            cases=${cases},
            cured=${cured},
            active=${active},
            deaths=${deaths}
    WHERE district_id=${districtId} ;`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

const getStateStatesResponse = (dbObject) => {
  return {
    totalCases: dbObject["SUM(cases)"],
    totalCured: dbObject["SUM(cured)"],
    totalActive: dbObject["SUM(active)"],
    totalDeaths: dbObject["SUM(deaths)"],
  };
};

//API-7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
        SELECT 
            SUM(cases),
            SUM(cured),
            SUM(active),
            SUM(deaths)
        FROM 
            district
        WHERE 
            state_id=${stateId}
    `;
  const stateStats = await db.get(getStatsQuery);
  response.send(getStateStatesResponse(stateStats));
});
// API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
    SELECT state_name FROM district NATURAL JOIN state
    WHERE district_id=${districtId};`;
  const getState = await db.get(getStateQuery);
  response.send({ stateName: getState.state_name });
});

module.exports = app;
