CloudinaryAPI = (function() {
    const url = 'https://api.cloudinary.com/v1_1/dnkgfobr8/image/upload';
    const preset = 'ymoszsjn';

    const upload = (payload) => {
        return new Promise((resolve, reject) => {
            const urls = [];

            let j = 0;
            for (let i = 0; i < payload.length; i++) {
                const data = new FormData();
                data.append('file', payload[i].file, payload[i].name);
                data.append('upload_preset', preset);
                fetch(url, {
                    method: 'POST',
                    body: data,
                }).then((res) => {
                    return res.text();
                }).then((data) => {
                    data = JSON.parse(data);
                    urls.push(`${data.secure_url}\n`);
                    j += 1;
                    if (j === payload.length) {
                        resolve({ urls });
                    }
                }).catch((err) => {
                    reject(err);
                });
            }
        });
    };

    return {
        upload: upload,
    };
})();
