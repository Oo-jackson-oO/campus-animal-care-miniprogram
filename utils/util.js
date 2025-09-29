const formatTime = date => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.error('formatTime: 无效的日期参数');
    return '';
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  if (n === null || n === undefined) {
    return '00';
  }
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const formatDate = date => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.error('formatDate: 无效的日期参数');
    return '';
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${year}-${formatNumber(month)}-${formatNumber(day)}`
}

const showToast = (title, icon = 'none') => {
  wx.showToast({
    title,
    icon,
    duration: 2000
  })
}

module.exports = {
  formatTime,
  formatDate,
  formatNumber,
  showToast
}
