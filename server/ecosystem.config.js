module.exports = {
  apps: [
    {
      name: "cafesite-wa-bot",
      script: "dist/index.js",
      cwd: __dirname,
      max_memory_restart: "300M",
      kill_timeout: 3000,
      restart_delay: 3000,
      autorestart: true,
      // Hanya boleh 1 instance: sesi WhatsApp (folder server/session/) terikat ke satu proses Chromium.
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
