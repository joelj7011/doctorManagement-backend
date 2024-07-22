const moment = require('moment');


const set_day = (day) => {
    switch (day.toLowerCase()) {
        case 'sunday':
            return day = 0;
        case 'monday':
            return day = 1;
        case 'tuesday':
            return day = 2;
        case 'wednesday':
            return day = 3;
        case 'thursday':
            return day = 4;
        case 'friday':
            return day = 5;
        case 'saturday':
            return day = 6;
        default:
            return res.staus(400).json({ error: "invalid day" });
    }
}

exports.Day_time_managment = (day, end) => {
    const dayNumber = set_day(day);
    const now = moment();
    let targetDateTime = now.day(dayNumber);

    targetDateTime.hour(moment(end, 'hh:mm A').hour())
        .minute(moment(end, 'hh:mm A').minute())
        .second(0)
        .millisecond(0);
    if (now.day() === dayNumber) {
        console.log("->", targetDateTime.toString());
        return targetDateTime.toString();
    } else {
        if (now.isAfter(targetDateTime)) {
            targetDateTime.add(1, 'week');
            return targetDateTime;
        }
    }
}