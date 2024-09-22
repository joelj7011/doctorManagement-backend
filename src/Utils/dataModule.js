let dataholder_array = [];

const addData = (day, scheduledTime, res) => {
  let newData = {
    day: day,
    date: scheduledTime,
  };
  dataholder_array.push(newData);
  if(dataholder_array.includes(day,scheduledTime)){
    dataholder_array.filter(
      (status) => status.date && status.date === newData.day && newData.date
    );
  }

  if (!dataholder_array.length > 0) {
    return res.status(500).json({ error: "array length too short" });
  } else {
    console.log("all good", dataholder_array);
  }
};

const getData = () => dataholder_array;

module.exports = {
  addData,
  getData,
};
