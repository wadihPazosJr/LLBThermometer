const validEmail = (email) => {
  var reg = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,4}$/i;
  return reg.test(email);
};

const isEmpty = (value) => {
  let stringCheck = value.replaceAll(" ", "").trim();

  if (stringCheck === "" || stringCheck.length === 0) {
    return true;
  } else {
    return false;
  }
};

const isValidPhoneNumber = (number) => {
  var re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;

  return re.test(number) && number.replace(/\D/g, "").length === 10;
};

export { validEmail, isEmpty, isValidPhoneNumber };
