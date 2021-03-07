const axios = require('axios')
const querystring = require('querystring')
const { HEADERS, DEPARTMENT_CODE } = require('./const')

function request (url, ref, data = {}) {
  return new Promise((resolve, reject) => {
    axios({
      url,
      method: 'post',
      params: { _: Date.now() },
      data: querystring.stringify(data),
      headers: {
        ...HEADERS,
        Referer: ref
      }
    }).then(r => resolve(r.data))
      .catch(reject)
  })
}

async function getUserInfo (openId) {
  try {
    const result = await request(
      'http://pay.ayfy.com/ayfy/rest/chaxunJiuzhenrenXinxi',
      'http://pay.ayfy.com/ayfy/webpage/wxpg/hao-yuan-fen-shi.html',
      { openId,
        context: 1
      }
    )
    return result.msg[0]
  } catch (error) {
    console.log('==============>')
    console.log(error)
    console.log('<==============')
    return null
  }
}

async function getSchedule (date) {
  try {
    const result = await request(
      'http://pay.ayfy.com/ayfy/rest/QueryAdmSchedule',
      'http://pay.ayfy.com/ayfy/webpage/wxpg/hao-yuan-xin-xi.html',
      {
        yydm: 'CXSPBQHTSYQ',
        DepartmentCode: DEPARTMENT_CODE,
        StartDate: date,
        EndDate: date,
        DoctCode: '',
        context: 1
      }
    )
    return result.obj.RecordCount === 0 ? [] : result.obj.Schedules.Schedule
  } catch (error) {
    console.log('==============>')
    console.log(error)
    console.log('<==============')
    return null
  }
}

async function bookSchedule (user, schedule) {
  try {
    const result = await request(
      'http://pay.ayfy.com/ayfy/rest/BookService',
      'http://pay.ayfy.com/ayfy/webpage/wxpg/que-ren-gua-hao.html',
      {
        yydm: 'CXSPBQHTSYQ',
        gender: user.sex,
        openId: user.openIdWeixin,
        orderType: '05',
        OrderAmount: 0,
        PatientName: user.hzxm,
        PatientCard: user.cardno,
        PatientID: user.patid,
        ScheduleItemCode: schedule.ScheduleItemCode,
        BeginTime: schedule.StartTime,
        EndTime: schedule.EndTime,
        DepartmentCode: DEPARTMENT_CODE,
        DepartmentName: schedule.DepartmentName,
        DoctorCode: schedule.DoctorCode,
        DoctorName: schedule.DoctorName,
        AdmitAddress: schedule.AdmitAddress,
        SessionName: schedule.SessionName,
        date: schedule.ServiceDate,
        AvailableNumStr: schedule.AvailableNumStr,
        context: 1
      }
    )
    const orderContent = result.obj && result.obj.OrderContent
    return { success: !!orderContent, msg: orderContent }
  } catch (error) {
    console.log('==============>')
    console.log(error)
    console.log('<==============')
    return { success: false, msg: '' }
  }
}

module.exports = {
  getSchedule,
  getUserInfo,
  bookSchedule
}
