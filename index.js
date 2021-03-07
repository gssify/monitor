const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const api = require('./api')
const { WORK_TYPE, SESSION } = require('./const')
const dayjs = require('dayjs')

function day2Date (days) {
  const nextWeek = dayjs().add(7, 'day')
  return days.map(d => nextWeek.day(d).format('YYYY-MM-DD'))
}

function log (msg) {
  const d = dayjs().format('hh:mm:ss SSS')
  console.log(`${d} ${msg}`)
}

function createSessionRob (user, schedules, date, session) {
  return new Promise(r => {
    const loop = async count => {
      if (count >= schedules.length) {
        r(false)
        log(`日期[${date}][${session}]很遗憾，该时间段未抢到号`)
      } else {
        const currentSchedule = schedules[count]
        const doctorName = currentSchedule.DoctorName
        log(`日期[${date}][${session}]抢号中: ${doctorName}`)
        const result = await api.bookSchedule(user, currentSchedule)
        if (result && result.success) {
          log(`日期[${date}][${session}]抢到了: ${doctorName}`)
          r(true)
        } else {
          log(`日期[${date}][${session}]未抢到: ${doctorName}`)
          loop(++count)
        }
      }
    }
    loop(0)
  })
}

async function getSchedule (date) {
  const loop = (count, r) => {
    log(`日期[${date}]尝试获取号源第 ${count} 次`)
    api.getSchedule(date).then(schedules => {
      if (schedules.length > 0) return r(schedules)
      throw new Error('try again')
    }).catch(() => setTimeout(() => loop(++count, r), 0))
  }
  return new Promise(r => loop(1, r))
}

async function bookSchedule (user, date) {
  log(`日期[${date}]准备获取号源`)
  let schedules = await getSchedule(date)
  schedules = schedules.filter(s => s.AvailableLeftNum > 0 && s.DoctorName.startsWith(WORK_TYPE))
  log(`日期[${date}]有效号源 ${schedules.length} 条`)
  if (schedules.length <= 0) return
  const groupSchedules = _.groupBy(schedules, 'SessionName')
  await Promise.all([
    createSessionRob(user, _.reverse(groupSchedules[SESSION.AM] || []), date, SESSION.AM),
    createSessionRob(user, _.reverse(groupSchedules[SESSION.PM] || []), date, SESSION.PM)
  ])
}

async function start (openId, days) {
  try {
    const user = await api.getUserInfo(openId)
    if (!user) return log('未查询到用户信息，请退出重试')

    log(`已查询到用户信息: ${user.hzxm}，准备抢号中`)
    for (let date of day2Date(days.sort())) {
      log(`日期[${date}]抢号开始 ========>` )
      await bookSchedule(user, date)
      log(`日期[${date}]抢号结束 <========` )
    }
  } catch (error) {
    log(error)
  }
}

let config = fs.readFileSync(path.resolve(__dirname, 'config.txt'), 'utf8')
let [openId, ...days] = config.split('\n')

openId = openId.trim()
days = _.uniq(days).filter(i => !!i).map(i => +i)

start(openId, days)
