const https = require('https');

https.get('https://ahmad-dev-two.vercel.app/api/blogs', (res) => {
    let data = '';
    console.log('Status Code:', res.statusCode);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Total Response Size:', (data.length / 1024 / 1024).toFixed(2), 'MB');
        try {
            const json = JSON.parse(data);
            if (Array.isArray(json)) {
                console.log(`Received ${json.length} articles.`);
                json.forEach((a, i) => console.log(`${i + 1}. ${a.title} | createdAt: ${a.createdAt} | author: ${a.author}`));
            } else {
                console.log('Response is not an array:', json);
            }
        } catch (e) {
            console.log('Failed to parse JSON. Error:', e.message);
            console.log('Beginning of response:', data.substring(0, 200));
        }
    });

}).on('error', (e) => {
    console.error(e);
});
