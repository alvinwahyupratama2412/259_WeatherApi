const express = require('express');
const aaxios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/lokasi', async (req, res) => {

    const kota = req.query.kota;

    if (!kota) {
        return res.status(400).json({
            message: 'Lokasi harus diisi'
        });
    }

    const apiKey = "TmW3n2IbOKaZxkghOoYB";

    try {

        // Mencari lokasi
        const url =
            `https://api.maptiler.com/geocoding/${encodeURIComponent(kota)}.json?key=${apiKey}&language=id`;

        const response = await aaxios.get(url);

        const data = response.data;

        if (!data.features || data.features.length === 0) {
            return res.status(404).json({
                message: 'Lokasi tidak ditemukan'
            });
        }

        const feature = data.features[0];

        const koordinat = feature.geometry.coordinates;

        const longitude = koordinat[0];
        const latitude = koordinat[1];

        // Mengambil negara dan provinsi
        const context = feature.context || [];

        let negara = '-';
        let provinsi = '-';

        context.forEach((item) => {

            if (item.id && item.id.startsWith('country')) {
                negara = item.text;
            }

            if (item.id && item.id.startsWith('region')) {
                provinsi = item.text;
            }

        });

        // Reverse geocoding untuk mencari kecamatan
        const reverseUrl =
            `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${apiKey}&language=id&types=municipal_district`;

        const reverseResponse =
            await aaxios.get(reverseUrl);

        const reverseData = reverseResponse.data;

        let kecamatan = '-';

        if (
            reverseData.features &&
            reverseData.features.length > 0
        ) {
            kecamatan =
                reverseData.features[0].text || '-';
        }

        res.json({
            lokasi: feature.text || kota,
            negara: negara,
            provinsi: provinsi,
            kecamatan: kecamatan,
            longitude: longitude,
            latitude: latitude
        });

    } catch (error) {

        console.error('ERROR MAPTILER:', error.response?.data || error.message);

        res.status(500).json({
            message: 'Gagal mengambil data dari MapTiler'
        });
    }
});

app.listen(PORT, () => {
    console.log(
        `Server berjalan di http://localhost:${PORT}`
    );
});