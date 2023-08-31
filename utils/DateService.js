exports.formatDate = (isoString) => {
  const date = new Date(isoString);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  hours = hours < 10 ? `0${hours}` : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  month = month < 10 ? "0" + month : month;
  day = day < 10 ? "0" + day : day;
  const strTime = `${hours}:${minutes}:${seconds}`;
  return `${day}-${month}-${date.getFullYear()} ${strTime}`;
}
