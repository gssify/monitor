const _ = require('lodash')
const api = require('./api')
const { WORK_TYPE, SESSION } = require('./const')
const dayjs = require('dayjs')

function day2Date (days) {
  const nextWeek = dayjs().add(7, 'day')
  return days.map(d => nextWeek.day(d).format('YYYY-MM-DD'))
}

async function createSessionRob (user, schedules, msg) {
  const loop = async count => {
    console.log(`[${msg}]正式抢号中...`)
    if (count >= schedules.length) {
      console.log(`[${msg}]未抢到号`)
    } else {
      const result = await api.bookSchedule(user, schedules[count])
      if (result.success) {
        console.log(`[${msg}]抢到了, ${result.msg}`)
      } else {
        loop(++count)
      }
    }
  }
  loop(0)
}

async function getSchedule (date) {
  const loop = (count, r) => {
    console.log(`[${date}]尝试获取号源第 ${count} 次`)
    api.getSchedule(date).then(schedules => {
      if (schedules.length > 0) return r(schedules)
      throw new Error('try again')
    }).catch(() => setTimeout(() => loop(++count, r), 1000))
  }
  return new Promise(r => loop(1, r))
}

async function bookSchedule (user, date) {
  console.log(`[${date}]准备获取号源`)
  let schedules = await getSchedule(date)
  console.log(`[${date}]号源已获取到`)
  schedules = schedules.filter(s => s.AvailableLeftNum > 0 && s.DoctorName.startsWith(WORK_TYPE))
  const groupSchedules = _.groupBy(schedules, 'SessionName')
  for (let session of [SESSION.AM, SESSION.PM]) {
    createSessionRob(user, groupSchedules[session] || [], date + ' ' + session)
  }
}

async function start (openId, days) {
  try {
    const user = await api.getUserInfo(openId)
    if (!user) return console.log('未查询到用户信息，请重试')

    console.log('已查询到用户信息，准备抢号中')
    for (let date of day2Date(days.sort())) {
      console.log(`[${date}]抢号开始` )
      await bookSchedule(user, date)
      console.log(`[${date}]抢号结束` )
    }
  } catch (error) {
    console.log(error)
  }
}

start('oZCuuuDWHL5mSPGkzlFfgOfgvYqg', [0,1,5])
