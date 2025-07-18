const axios = require('axios');
const { SCRAP_URL } = require('../../static/static');

async function checkPanWithCameo(companyCode, pans) {
  try {
    let calls = [];
    for (let i = 0; i < pans.length; ++i) {
      if (pans[i].panNumber) {
        calls.push(
          axios.post(SCRAP_URL.CAMEO, {
            code: companyCode,
            type: 'pan',
            value: pans[i].panNumber,
          })
        );
      }
    }

    let results = await Promise.allSettled(calls);

    // check for alloted, not applied, not alloted
    const res = {};
    results.forEach((response, index) => {
      let panNumber = pans[index].panNumber;

      if (response.status == 'rejected') {
        console.log(`rejected for pan ${panNumber}`);
        res[panNumber] = -1;
        return;
      }

      if (!response.value || !response.value.data) {
        console.log(`empty response for pan ${panNumber}`);
        res[panNumber] = -1;
        return;
      }

      let data = response.value.data;

      if (data.length == 0) {
        res[panNumber] = -1;
      } else {
        if (data[0].refundAmount > 0 && data[0].allotedShares == 0) {
          res[panNumber] = 0;
        } else if (data[0].allotedShares > 0) {
          res[panNumber] = data[0].allotedShares;
        }
      }
    });

    return res;
  } catch (err) {
    console.log('while checking allotment', err);
    throw new Error('Something went wrong while checking allotment');
  }
}

module.exports = { checkPanWithCameo };
