const R = require('ramda');
const GeoPoint = require('geopoint');
const XLSX = require('xlsx');
const workbook = XLSX.readFile('locations.xlsx');

const first_sheet_name = workbook.SheetNames[0];
const worksheet = workbook.Sheets[first_sheet_name];

// Construct the dataSet based on xls.
let dataSet = {};
// 130 is rows number, should be dynamic from a prop of the api.
for(let i = 2; i < 130; i++) {
  const lat = worksheet[`C${i}`].v;
  const long = worksheet[`D${i}`].v;

  dataSet[worksheet[`A${i}`].v] = {
    name: worksheet[`B${i}`].v,
    lat,
    long,
    point: new GeoPoint(lat, long),
  }
}

const appendDistance = candidate => (acc, curr) =>
  // Based on a candidate and a location, return -> { 'locationName': distance } (append to array)
  R.append({ [curr.name]: candidate.distanceTo(curr.point, true) }, acc);

// Generate array of distances from candidate -> [{ 'locationName': distance }, ...]
const candidateOffices = (candidate, data) => R.compose(
  R.reduce(appendDistance(candidate), []),
  R.values
)(data);

const byDistance = R.ascend(
  // Take distance value { 'locationName': distance } -> distance
  R.compose(R.head, R.values)
);

const sortedOffices = R.sort(byDistance);

// Main function
// given a candidate, a dataSet with locations and optional n limit (if n not specified, then top 3)
// it will recommend the n nearest locations
// returns (distance from candidate to location) [{ 'locationName': distance }, ...]
function getCandidateNearOffices(candidate, data, n = 3) {
  const offices = candidateOffices(candidate, data);
  return R.take(n, sortedOffices(offices));
}

// Test data
// ... it is assumed that there is no repeated locality names,
// otherwise data structure could be { name: 'locality', distance: 123 }
const firstCandidate = new GeoPoint(-34.5766151, -58.4534977);
const secondCandidate = new GeoPoint(-34.6465397, -58.4585211);

console.log('firstCandidate nearest offices: ', '\n', getCandidateNearOffices(firstCandidate, dataSet));
console.log('-----');
console.log('secondCandidate nearest offices: ', '\n', getCandidateNearOffices(secondCandidate, dataSet));
