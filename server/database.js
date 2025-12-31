const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "words.db";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT,
            nikud TEXT,
            image TEXT,
            level INTEGER,
            image_path TEXT
            )`,
            (err) => {
                if (err) {
                    // Table already created
                } else {
                    // Create Scores Table
                    db.run(`CREATE TABLE IF NOT EXISTS scores (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT,
                        score INTEGER,
                        date TEXT
                    )`);

                    console.log('Seeding initial data (Sorted easy to hard)...');
                    const insert = 'INSERT INTO words (word, nikud, image, level, image_path) VALUES (?,?,?,?,?)';

                    const level1Words = [
                        ["hand", "יָד", "✋", 1, "/images/hand.png"], ["fish", "דָּג", "🐟", 1, "/images/fish.png"], ["garden", "גַּן", "🌳", 1, "/images/garden.png"],
                        ["mountain", "הַר", "⛰️", 1, "/images/mountain.png"], ["turtle", "צָב", "🐢", 1, "/images/turtle.png"], ["sea", "יָם", "🌊", 1, "/images/sea.png"],
                        ["camel", "גָּמָל", "🐫", 1, "/images/camel.png"], ["dad", "אַבָּא", "👨", 1, "/images/dad.png"], ["grandpa", "סַבָּא", "👴", 1, "/images/grandpa.png"],
                        ["milk", "חָלָב", "🥛", 1, "/images/milk.png"], ["banana", "בַּנָּנָה", "🍌", 1, "/images/banana.png"], ["gift", "מַתָּנָה", "🎁", 1, "/images/gift.png"],
                        ["cloud", "עָנָן", "☁️", 1, "/images/cloud.png"], ["gold", "זָהָב", "✨", 1, "/images/gold.png"], ["map", "מַפָּה", "🗺️", 1, "/images/map.png"],
                        ["time", "זְמַן", "⏳", 1, "/images/time.png"], ["white", "לָבָן", "⚪", 1, "/images/white.png"],
                        ["yellow", "צָהֹב", "💛", 1, "/images/yellow.png"], ["pan", "מַחֲבַת", "🍳", 1, "/images/pan.png"], ["butterfly", "פַּרְפַּר", "🦋", 1, "/images/butterfly.png"],
                        ["scorpion", "עַקְרָב", "🦂", 1, "/images/scorpion.png"], ["caterpillar", "זַחַל", "🐛", 1, "/images/caterpillar.png"], ["meat", "בָּשָׂר", "🥩", 1, "/images/meat.png"],
                        ["salad", "סָלָט", "🥗", 1, "/images/salad.png"], ["onion", "בָּצָל", "🧅", 1, "/images/onion.png"],
                        ["astronaut", "אַסְטְרוֹנָאוּט", "👨‍🚀", 1, "/images/astronaut.png"], ["basket", "סַל", "🧺", 1, "/images/basket.png"],
                        ["blood", "דָּם", "🩸", 1, "/images/blood.png"], ["cold", "קַר", "❄️", 1, "/images/cold.png"], ["queen", "מַלְכָּה", "👑", 1, "/images/queen.png"],
                        ["line", "קַו", "➖", 1, "/images/line.png"], ["snail", "שַׁבְּלוּל", "🐌", 1, "/images/snail.png"]
                    ];

                    const level2Words = [
                        ["city", "עִיר", "🏙️", 2, "/images/city.png"], ["song", "שִׁיר", "🎤", 2, "/images/song.png"], ["chalk", "גִּיר", "🖍️", 2, "/images/chalk.png"],
                        ["wall", "קִיר", "🧱", 2, "/images/wall.png"], ["pot", "סִיר", "🍲", 2, "/images/pot.png"], ["bag", "תִּיק", "🎒", 2, "/images/bag.png"],
                        ["elephant", "פִּיל", "🐘", 2, "/images/elephant.png"], ["island", "אִי", "🏝️", 2, "/images/island.png"], ["mom", "אִמָּא", "👩", 2, "/images/mom.png"],
                        ["man", "אִישׁ", "👨", 2, "/images/man.png"],
                        ["bucket", "דְּלִי", "🪣", 2, "/images/bucket.png"], ["story", "סִפּוּר", "📖", 2, "/images/story.png"],
                        ["cookie", "עוּגִיָּה", "🍪", 2, "/images/cookie.png"], ["hero", "גִּבּוֹר", "🦸", 2, "/images/hero.png"], ["violin", "כִּנּוֹר", "🎻", 2, "/images/violin.png"],
                        ["lemon", "לִימוֹן", "🍋", 2, "/images/lemon.png"], ["umbrella", "מִטְרִיָּה", "☂️", 2, "/images/umbrella.png"], ["who", "מִי", "❓", 2, "/images/who.png"]
                    ];

                    const level3Words = [
                        ["book", "סֵפֶר", "📚", 3, "/images/book.png"], ["flag", "דֶּגֶל", "🇮🇱", 3, "/images/flag.png"], ["king", "מֶלֶךְ", "👑", 3, "/images/king.png"], ["bread", "לֶחֶם", "🍞", 3, "/images/bread.png"],
                        ["salt", "מֶלַח", "🧂", 3, "/images/salt.png"], ["shoe", "נַעַל", "👟", 3, "/images/shoe.png"], ["sock", "גֶּרֶב", "🧦", 3, "/images/sock.png"],
                        ["heart", "לֵב", "❤️", 3, "/images/heart.png"], ["lion", "אַרְיֵה", "🦁", 3, "/images/lion.png"], ["egg", "בֵּיצָה", "🥚", 3, "/images/egg.png"], ["train", "רַכֶּבת", "🚂", 3, "/images/train.png"], ["notebook", "מַחְבֶּרֶת", "📒", 3, "/images/notebook.png"],
                        ["camera", "מַצְלֵמָה", "📷", 3, "/images/camera.png"], ["towel", "מַגֶּבֶת", "🧼", 3, "/images/towel.png"], ["field", "שָׂדֶה", "🌾", 3, "/images/field.png"],
                        ["fence", "גָּדֵר", "🚧", 3, "/images/fence.png"], ["dog", "כֶּלֶב", "🐶", 3, "/images/dog.png"], ["eye", "עַיִן", "👁️", 3, "/images/eye.png"],
                        ["plate", "צַלַּחַת", "🍽️", 3, "/images/plate.png"]
                    ];

                    const level4Words = [
                        ["bear", "דֹּב", "🐻", 4, "/images/bear.png"], ["drum", "תֹּף", "🥁", 4, "/images/drum.png"], ["light", "אוֹר", "💡", 4, "/images/light.png"],
                        ["balloon", "בַּלּוֹן", "🎈", 4, "/images/balloon.png"], ["doll", "בֻּבָּה", "🪆", 4, "/images/doll.png"], ["ball", "כַּדּוּר", "⚽", 4, "/images/ball.png"],
                        ["car", "מְכוֹנִית", "🚗", 4, "/images/car.png"], ["ship", "אֳנִיָּה", "🚢", 4, "/images/ship.png"], ["cup", "כּוֹס", "🥤", 4, "/images/cup.png"],
                        ["pizza", "פִּיצָה", "🍕", 4, "/images/pizza.png"], ["computer", "מַחְשֵׁב", "💻", 4, "/images/computer.png"], ["window", "חַלּוֹן", "🪟", 4, "/images/window.png"],
                        ["blue", "כָּחֹל", "🔵", 4, "/images/blue.png"], ["red", "אָדֹם", "🔴", 4, "/images/red.png"], ["green", "יָרֹק", "🟢", 4, "/images/green.png"],
                        ["donkey", "חֲמוֹר", "🫏", 4, "/images/donkey.png"], ["orange", "כָּתֹם", "🟠", 4, "/images/orange.png"]
                    ];

                    const stmt = db.prepare(insert);

                    level1Words.forEach(w => stmt.run(w));
                    level2Words.forEach(w => stmt.run(w));
                    level3Words.forEach(w => stmt.run(w));
                    level4Words.forEach(w => stmt.run(w));

                    stmt.finalize();
                }
            });
    }
});

module.exports = db;
