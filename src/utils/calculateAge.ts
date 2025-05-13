const BIRTH_DATE = { year: 2002, month: 9, day: 6 };

export const calculateAge = (birthDate = BIRTH_DATE): number => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  let age = currentYear - birthDate.year;

  if (
    currentMonth < birthDate.month ||
    (currentMonth === birthDate.month && currentDay < birthDate.day)
  ) {
    age--;
  }

  return age;
};

export const setupAgeUpdate = (
  setAge: React.Dispatch<React.SetStateAction<number>>,
  birthDate = BIRTH_DATE
) => {
  const updateAge = () => {
    setAge(calculateAge(birthDate));
  };

  const checkAndUpdateAge = () => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const timeUntilMidnight = nextMidnight.getTime() - now.getTime();

    return setTimeout(() => {
      updateAge();
      checkAndUpdateAge();
    }, timeUntilMidnight);
  };

  updateAge();
  checkAndUpdateAge();
};
