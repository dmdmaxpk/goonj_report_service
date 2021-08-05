class Helper {
    static getCurrentDate() {
        let now = new Date();
        let strDateTime = [
            [now.getFullYear(),
                this.addZero(now.getMonth() + 1),
                this.addZero(now.getDate())].join("-"),
            [this.addZero(now.getHours()),
                this.addZero(now.getMinutes())].join(":")];
        return strDateTime;
    }

    static addZero(num) {
        return (num >= 0 && num < 10) ? "0" + num : num + "";
    }

    static timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = Helper;