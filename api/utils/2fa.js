const { authenticator } = require("otplib");
const QRCode = require("qrcode");

const createSecret = () => {
  return authenticator.generateSecret();
};

const getKeyURI = (wallet, secret) => {
  const keyuri = authenticator.keyuri(wallet, "D3fenders", secret);
  return keyuri;
};

const getQrCode = async (keyuri) => {
  const url = await QRCode.toDataURL(keyuri);
  return url;
};

const getToken = (secret) => {
  return generate("totp", secret, 0, 30, 6, "SHA1");
  // return authenticator.generate(secret);
};

const verifyCode = async (code, secret) => {
  if (!authenticator.check(code, secret)) {
    return false;
  }
  return true;
};

async function syncTimeWithGoogle() {
  try {
    const https = require("https");
    const options = {
      method: "HEAD",
      hostname: "www.google.com",
      path: "/generate_204",
    };

    const res = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        resolve(res);
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.end();
    });

    const date = res.headers["date"];
    if (!date) {
      return "updateFailure";
    }
    const serverTime = new Date(date).getTime();
    const clientTime = new Date().getTime();
    const offset = Math.round((serverTime - clientTime) / 1000);

    return offset;
  } catch (error) {
    throw error;
  }
}

function dec2hex(s) {
  return (s < 15.5 ? "0" : "") + Math.round(s).toString(16);
}

function hex2dec(s) {
  return Number(`0x${s}`);
}

function hex2str(hex) {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(hex2dec(hex.substr(i, 2)));
  }
  return str;
}

function leftpad(str, len, pad) {
  if (len + 1 >= str.length) {
    str = new Array(len + 1 - str.length).join(pad) + str;
  }
  return str;
}

function base32tohex(base32) {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let hex = "";
  let padding = 0;

  for (let i = 0; i < base32.length; i++) {
    if (base32.charAt(i) === "=") {
      bits += "00000";
      padding++;
    } else {
      const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
      bits += leftpad(val.toString(2), 5, "0");
    }
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.substr(i, 4);
    hex = hex + Number(`0b${chunk}`).toString(16);
  }

  switch (padding) {
    case 0:
      break;
    case 6:
      hex = hex.substr(0, hex.length - 8);
      break;
    case 4:
      hex = hex.substr(0, hex.length - 6);
      break;
    case 3:
      hex = hex.substr(0, hex.length - 4);
      break;
    case 1:
      hex = hex.substr(0, hex.length - 2);
      break;
    default:
      throw new Error("Invalid Base32 string");
  }

  return hex;
}

function base26(num) {
  const chars = "23456789BCDFGHJKMNPQRTVWXY";
  let output = "";
  const len = 5;
  for (let i = 0; i < len; i++) {
    output += chars[num % chars.length];
    num = Math.floor(num / chars.length);
  }
  if (output.length < len) {
    output = new Array(len - output.length + 1).join(chars[0]) + output;
  }
  return output;
}

(async () => {
  const offset = await syncTimeWithGoogle();
  global.systemOffset = offset;
})();

module.exports = {
  createSecret,
  getQrCode,
  verifyCode,
  getToken,
  getKeyURI,
};
