const axios = require('axios');
const { SCRAP_URL } = require('../../static/static');

async function checkPanWithBigshare(companyCode, pans) {
  try {
    let calls = [];
    for (let i = 0; i < pans.length; ++i) {
      if (pans[i].panNumber) {
        calls.push(
          axios.post(SCRAP_URL.BIGSHARE, {
            Company: companyCode,
            PanNo: pans[i].panNumber,
            SelectionType: 'PN',
            ddlType: '0',
            Applicationno: '',
            txtcsdl: '',
            txtDPID: '',
            txtClId: '',
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

      if (!response.value || !response.value.data || !response.value.data.d) {
        console.log(`empty response for pan ${pans[index].panNumber}`);
        res[pans[index].panNumber] = -1;
        return;
      }

      let data = response.value.data.d;

      if (data.APPLIED == '' && data.ALLOTED == '') {
        res[panNumber] = -1;
      } else {
        if (parseInt(data.APPLIED) > 0 && data.ALLOTED == 'NON-ALLOTTE') {
          res[panNumber] = 0;
        } else if (parseInt(data.ALLOTED) > 0) {
          res[panNumber] = data.ALLOTED;
        }
      }
    });

    return res;
  } catch (err) {
    console.log('while checking allotment', err);
    throw new Error('Something went wrong while checking allotment');
  }
}

module.exports = { checkPanWithBigshare };
