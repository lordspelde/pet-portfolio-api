const express = require('express');
const router = express.Router();
const db = require('../db/database');

function getPetByName(name) {
    const pets = db.prepare('SELECT * FROM pets WHERE LOWER(name) = ?');

    return pets.get(name.toLowerCase());
}

router.get('/', (req, res) => {
    try {
        const pets = db.prepare(`
            SELECT *
            FROM pets
            ORDER BY name
        `).all();

        res.json(pets);
    } catch (error) {
        console.log(error);

        res.status(500).json({ error: 'Failed to fetch pets' });
    }
});

router.get('/:name', (req, res) => {
    try {
        const pet = getPetByName(req.params.name);

        if (!pet) {
            return res.status(404).json({error: "Pet not found"});
        }

        // add photos
        const photos = db.prepare(`
            SELECT url
            FROM photos
            WHERE pet_id = ?
        `).all(pet.id);

        pet.photos = photos.map(p => p.url);

        res.json(pet);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch the pet' });
    }
});

router.post('/', (req, res) => {
    const { name, features, descriptors, photos } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        // Insert the location
        const result = db.prepare(`
            INSERT INTO pets (name, features, descriptors)
            VALUES (?, ?, ?)
        `).run(name, features || null, descriptors || null);

        const petId = result.lastInsertRowid;

        // Insert features into join table (if provided)
        if (Array.isArray(photos)) {
            const insertFeature = db.prepare(`
                INSERT INTO photos (pet_id, url)
                VALUES (?, ?)
            `);

            for (const url of photos) {
                insertFeature.run(petId, url);
            }
        }

        // Return the created location with features
        const newLocation = {
            id: petId,
            features: features || null,
            descriptors: descriptors || null,
            photos: Array.isArray(photos) ? photos : []
        };

        res.status(201).json(newLocation);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to create location' });
    }
});

router.post('/:name/photos', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Photo URL is required' });
    }

    try {
        const pet = getPetByName(req.params.name);

        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        db.prepare(`
            INSERT INTO photos (pet_id, url)
            VALUES (?, ?)
        `).run(pet.id, url);

        res.status(201).json({ message: 'Photo added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add photo' });
    }
});

module.exports = router;