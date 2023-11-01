export class DateFunctions {
  static getDateShort(baseDate) {
    let date;
    if (baseDate === undefined) {
      date = new Date();
    } else {
      date = new Date(baseDate);
    }
    const year = date.getFullYear();
    const month = date.getMonth() + 1 < 10 ? 
      `0${(date.getMonth() + 1)}` : 
      date.getMonth() + 1;
    const day = date.getDate() + 1 < 10 ? 
      `0${(date.getDate() + 1)}` : 
      date.getDate() + 1;

    return `${day}/${month}/${year}`;
  }

  static getDateLong() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1 < 10 ? 
      `0${(date.getMonth() + 1)}` : 
      date.getMonth() + 1;
    const day = date.getDate() + 1 < 10 ? 
      `0${(date.getDate() + 1)}` : 
      date.getDate() + 1;

    const hour = date.getHours() < 10 ? 
      `0${date.getHours()}` : 
      date.getHours();
    const minute = date.getMinutes() < 10 ? 
      `0${date.getMinutes()}` : 
      date.getMinutes();
    const second = date.getSeconds() < 10 ? 
      `0${date.getSeconds()}` : 
      date.getSeconds();

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }
}