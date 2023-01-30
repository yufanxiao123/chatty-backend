export class Helpers {
  //convert username each word's first letter to uppercase
  static firstLetterUppercase(str: string): string {
    let formatStr = str.split(' ');
    formatStr = formatStr.map((value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`);
    return formatStr.join(' ');
  }

  static lowerCase(str: string): string {
    return str.toLowerCase();
  }

  static generateRandomIntegers(intergerLength: number): number {
    const characters = '0123456789';
    let result = ' ';
    const charactersLength = characters.length;
    for (let i = 0; i < intergerLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return parseInt(result, 10);
  }

  static parseJson(prop: string): any {
    try {
      JSON.parse(prop);
      //if prop is not stringfied , will error. nomal string will lead to error
    } catch (error) {
      return prop;
    }
  }
}
