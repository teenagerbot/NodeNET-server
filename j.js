const { networkInterfaces } = require('os');

const interfaces = networkInterfaces();
const addresses = [];

for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
        // Фильтруем IPv4-адреса, пропускаем локальные адреса и адреса петли
        if (iface.family === 'IPv4' && !iface.internal) {
            addresses.push(iface.address);
        }
    }
}

console.log(addresses);


const net = require('net');
const fs = require('fs');

const serverPort = 3000; // Порт сервера

// Запускаем сервер
const server = net.createServer((socket) => {
    console.log('Получено новое соединение');

    // При получении данных через сокет, записываем их в файл
    socket.on('data', (data) => {
        const receivedFile = 'receivedFile.txt'; // Путь, по которому будет сохранен полученный файл

        // Создаем поток для записи данных в файл
        const fileStream = fs.createWriteStream(receivedFile, { flags: 'a' });
        fileStream.write(data);

        console.log('Принято и сохранено', data.length, 'байт');
    });

    // Обработчик события завершения передачи данных
    socket.on('end', () => {
        console.log('Передача данных завершена');
        socket.end();
    });
});

// Запускаем сервер на заданном порту
server.listen(serverPort, () => {
    console.log(`Сервер запущен и прослушивает порт ${serverPort}`);

    // Создаем клиентское TCP-соединение
    const client = net.createConnection({ host: addresses[1], port: serverPort }, () => {
        console.log('Установлено соединение с сервером');

        const fileToSend = 'h.txt'; // Путь к файлу, который нужно отправить

        // Читаем содержимое файла и отправляем его через сокет
        const stream = fs.createReadStream(fileToSend);
        stream.on('data', (data) => {
            client.write(data);
        });

        // Обработчик события завершения чтения файла
        stream.on('end', () => {
            client.end();
            console.log('Файл успешно отправлен');
        });
    });

    // Обработчик события ошибки соединения
    client.on('error', (err) => {
        console.error('Ошибка соединения:', err);
    });
});
