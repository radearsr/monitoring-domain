const { formatDate } = require("./dateService");

exports.MESSAGE_REPLY = {
  START_COMMAND: `Hello I'm IT Support BOT :)`,
  KEYBOARD_START: [["CEK SSL", "CEK DOMAIN"],["FORMAT"]],
  FORMAT_COMMAND: ">>>>> Format Aksi BOT <<<<<\n\n** Tambah Monitoring SSL **\nSSL#Aksi#Nama#Domain#Port#Tempat\nContoh\nSSL#ADD#Web PMK#report.serverpmk.com#443#10.5.7.208\n\n** Tambah Monitoring Domain **\nDOMAIN#Aksi#Hosting#Domain\nContoh\nDOMAIN#ADD#Niagahoster#unitedtronik.co.id",
  DOMAIN_ADD_FAILED: "[ FAILED ADD DOMAIN 🔴] Gagal menambahkan domain baru",
  SSL_ADD_FAILED: "[ FAILED ADD SSL 🔴] Gagal menambahkan ssl domain baru",
  ACTION_NOT_FOUND: "Aksi tidak tersedia",
  GENERAL_ERROR: "Terjadi kegagalan pada server",
  DOMAIN_ADD_SUCCESS: (domain, expired) => (`[ SUCCESS ADD DOMAIN 🟢 ]\nDomain ${domain}\nExpired ${expired}`),
  SSL_ADD_SUCCESS: (domain, port, expired) => (`[ SUCCESS ADD SSL 🟢 ]\nDomain ${domain}\nPort ${port}\nExpired ${formatDate(expired)}`),
};
