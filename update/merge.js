	// voegt nieuwe entiteiten toe aan de sets in de data/ directories van ldk en curriculum-doelen
	// dit is de laatste stap.
	var fs = require('fs');
	var types = ['doel','doelniveau','tag','ldk_vak','ldk_vakkern','ldk_vaksubkern','ldk_vakinhoud'];
	var files = {
		'doel': 'doelen.json',
		'doelniveau': 'doelniveaus.json',
		'ldk_vak': 'ldk.vakken.json',
		'ldk_vakkern': 'ldk.vakkernen.json',
		'ldk_vaksubkern': 'ldk.vaksubkernen.json',
		'ldk_vakinhoud': 'ldk.vakinhouden.json',
		'tag': 'tags.json'
	};

	var sourceDirs = {
		'doel': 'data/',
		'doelniveau': 'data/',
		'ldk_vak': 'updated/',
		'ldk_vakkern': 'updated/',
		'ldk_vaksubkern': 'updated/',
		'ldk_vakinhoud': 'updated/',
		'tag': 'data/'
	};

	var targetDirs = {
		'doel': '../curriculum-doelen/data/',
		'doelniveau': '../curriculum-doelen/data/',
		'ldk_vak': '../data/',
		'ldk_vakkern': '../data/',
		'ldk_vaksubkern': '../data/',
		'ldk_vakinhoud': '../data/',
		'tag': '../curriculum-doelen/data/'
	};

	var all = {};
	types.forEach(function(type) {
		all[type] = [];
	});

	
	types.forEach(function(type) {
		var idIndex = {};
		console.log('type',type+': '+files[type]);
		console.log('reading '+targetDirs[type]+files[type]);
		var source = JSON.parse(fs.readFileSync(targetDirs[type]+files[type]));
		source.forEach(function(entiteit) {
			idIndex[entiteit.id] = entiteit;
		});
		console.log('found '+source.length+' existing entities');

		console.log('reading '+sourceDirs[type]+files[type]);
		var file = fs.readFileSync(sourceDirs[type]+files[type]);
		if (!file) {
			console.log(type+' is leeg');
		}
		var addedCount = 0;
		var entiteiten = JSON.parse(file);
		entiteiten.forEach(function(entiteit) {
			if (!idIndex[entiteit.id]) {
				idIndex[entiteit.id] = entiteit;
				source.push(entiteit);
				addedCount++;
			} else {
				Object.assign(idIndex[entiteit.id], entiteit);
			}
		});

		var fileData = JSON.stringify(source, null, "\t");
		console.log('writing ./merged/'+files[type]);
		fs.writeFileSync('./merged/'+files[type], fileData);
		console.log('added '+addedCount+' entities');
	});
