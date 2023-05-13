const express = require("express");
const app = express();

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbobject = (dbobject) => {
  return {
    stateId: dbobject.state_id,
    stateName: dbobject.state_name,
    population: dbobject.population,
  };
};

const convertDbobjecttoResponse = (dbobject) => {
  return {
    stateName: dbobject.state_name,
    population: dbobject.population,
    districtId: dbobject.district_id,
    districtName: dbobject.district_name,
    stateId: dbobject.state_id,
    cases: dbobject.cases,
    cured: dbobject.cured,
    active: dbobject.active,
    deaths: dbobject.deaths,
  };
};

const converttoobject = (dbobject) => {
  return {
    totalCases: dbobject.cases,
    totalCured: dbobject.cured,
    totalActive: dbobject.active,
    totalDeaths: dbobject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStateQuery = `
        select *
        from state;
        `;
  const players = await db.all(getStateQuery);
  response.send(players.map((eachplayer) => convertDbobject(eachplayer)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getstateQuerybyid = `
    select * 
    from state
    where state_id=${stateId};
    `;
  const state = await db.get(getstateQuerybyid);
  response.send(convertDbobject(state));
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO district
    (district_name,state_id,cases,cured,active,deaths)
    VALUES
    (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );
    `;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getdistrictQuerybyid = `
    select * 
    from district
    where district_id=${districtId};
    `;
  const district = await db.get(getdistrictQuerybyid);
  response.send(convertDbobjecttoResponse(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictquery = `
        delete from district
        where district_id=${districtId};
    `;
  await db.run(deleteDistrictquery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updatedistrictQuery = `
        update district
        set 
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
        where district_id=${districtId};
    `;
  await db.run(updatedistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getstateQuerybyid = `
    select SUM(cases) as cases,
    SUM(cured) as cured,
    SUM(active) as active,
    SUM(deaths) as deaths 
    from district
    where state_id=${stateId};
    `;
  const stateDetails = await db.get(getstateQuerybyid);
  response.send(converttoobject(stateDetails));
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const statequery = `
        select state_name
        from state natural join district
        where district_id=${districtId};
    `;
  const state = await db.get(statequery);
  response.send(convertDbobjecttoResponse(state));
});

module.exports = app;
