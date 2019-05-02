
	var fetch = require('node-fetch');
	var fs = require('fs');

	var update = {
		'ldk_vak' : 'vak_id',
		'ldk_vakkern': 'vakkern_id',
		'ldk_vaksubkern': 'vaksubkern_id',
		'ldk_vakinhoud': 'vakinhoud_id'
	};

	var files = {
		'ldk_vak': 'ldk.vakken.json',
		'ldk_vakkern': 'ldk.vakkernen.json',
		'ldk_vaksubkern': 'ldk.vaksubkernen.json',
		'ldk_vakinhoud': 'ldk.vakinhouden.json'
	};


	function getEntiteitByID(id) {
		return idIndex[id];
	}

	function getChildren(entiteit) {
		var type = typeIndex[entiteit.id];
		switch(type) {
			case 'ldk_vak':
				return entiteit.ldk_vakkern_id.map(getEntiteitByID);
			break;
			case 'ldk_vakkern':
				return entiteit.ldk_vaksubkern_id.map(getEntiteitByID);
			break;
			case 'ldk_vaksubkern':
				return entiteit.ldk_vakinhoud_id.map(getEntiteitByID);
			break;
			case 'ldk_vakinhoud':
				return [];
			break;
		}
		return [];
	}

	function walkTree(node, callback, parents) {
		if (!parents) {
			parents = [];
		}
		callback(node, parents);
		var children = getChildren(node);
		children.forEach(function(child) {
			walkTree(child, callback, parents.concat(node));
		});	
	};

	function fixChildID(id) {
		//FIXME: somehow '1a' stuff gets through
		return obkIndex[id] || id;
	}

	function getOBKID(entiteit) {
		var type = typeIndex[entiteit.id];
		switch(type) {
			case 'ldk_vak':
				return entiteit.vak_id;
			break;
			case 'ldk_vakkern':
				return entiteit.vakkern_id;
			break;
			case 'ldk_vaksubkern':
				return entiteit.vaksubkern_id;
			break;
		}
		return null;
	}

	function setOBKID(entiteit, id) {
		var type = typeIndex[entiteit.id];
		switch(type) {
			case 'ldk_vak':
				entiteit.vak_id = id;
			break;
			case 'ldk_vakkern':
				entiteit.vakkern_id = id;
			break;
			case 'ldk_vaksubkern':
				entiteit.vaksubkern_id = id;
			break;
		}
	}

	function makeLegacyURL(parents) {
		if (!parents) {
			return false;
		}
		var names = ['vak','vakkern','vaksubkern','vakinhoud'];
		var updatedIDS = parents.map(function(parent) {
			return getOBKID(parent);
		});
		if (updatedIDS.filter(function(id) { return !id; }).length) {
			return false;
		}
		if (updatedIDS.filter(function(id) { return id.length<36; }).length) {
			console.log('illegal ids found', updatedIDS);
			console.log(parents);
			process.exit();
		}
		var params = parents.map(function(parent, index) {
			return names[index]+'/'+updatedIDS[index]; //getOBKID(parent);
		}).join('/');
		var baseURL = 'https://opendata.slo.nl/curriculum/api/v1/legacy/';
		var result = baseURL + params;
		return result;
	}

	function findRoots() {
		return sources.ldk_vak;
	}

	var typeIndex = {};
	var sources = {};
	var idIndex = {};
	var obkIndex = {};

	//This routine generates an index of which old entity id (obk) matches with the new
	// generated uuids
	// update is an object with ( type => property_name ) where property_name is the name
	// that should contain the entity ID as used in curriculum-inhouden, if it exists
	Object.keys(update).forEach(function(type) {
		console.log('type',type+': '+files[type]);
		var source = JSON.parse(fs.readFileSync('data/'+files[type]));
		var updateName = update[type];
		source.forEach(function(entiteit) {
			idIndex[entiteit.id] = entiteit;
			typeIndex[entiteit.id] = type;
			if (entiteit[updateName]) {
				obkIndex[entiteit[updateName]] = entiteit.id;
			}
			var obkID = getOBKID(entiteit);
			if (obkID && obkID.length<36) {
				console.log(obkID+': '+entiteit.id);
				setOBKID(entiteit, null); // remove unknown id's - temp ID's only valid in the excel sheet
			}
		});
		sources[type] = source;
	});

	Object.keys(sources).forEach(function(type) {
		// entities child arrays link to incorrect id's, update these
		sources[type].forEach(function(entiteit) {
			var children = false;
			switch (type) {
				case 'ldk_vak':
					entiteit.ldk_vakkern_id = entiteit.ldk_vakkern_id.map(fixChildID);
				break;
				case 'ldk_vakkern':
					entiteit.ldk_vaksubkern_id = entiteit.ldk_vaksubkern_id.map(fixChildID);
				break;
				case 'ldk_vaksubkern':
					entiteit.ldk_vakinhoud_id = entiteit.ldk_vakinhoud_id.map(fixChildID);
				break;
			}
		});
	});

	var promises = [];

	var urlsToFetch = [];

	var crawl = function(url, headers) {
		return new Promise(function(resolve, reject) {
			urlsToFetch.push({
				url: url,
				headers: headers,
				resolve: resolve,
				reject: reject
			});
		});
	};

	findRoots()
	.forEach(
		function(root) {
			walkTree(
				root, 
				function(node, parents) {
					// get type
					var type = typeIndex[node.id];

					// check if node has id's to update
					var updateName = update[type];
					if (!updateName) {
						console.log('nothing to update for '+node.id+' type '+type+' ('+updateName+')');
						return;
					}
					var parentList = [];
					// if so get the url for the legacy api
					var updateURL = makeLegacyURL(parents.concat(node));
					if (!updateURL){
						console.log('skipping ',node);
						return;
					}
					// fetch it
					console.log(updateURL);

					promises.push(crawl(updateURL, {
						headers: {
							'Accept': 'application/json'
						}
					})
					.then(function(json) {
						if (json.length!=1) {
							// or log the link id and the list of replacements for manual fixing
							// FIXME: check that the given id actually exists - if not the node id should be set to this
							return fetch('https://opendata.slo.nl/curriculum/api/v1/uuid/'+node[updateName],{
								headers: {
									'Accept': 'application/json'
								}
							})
							.then(function(data) {
								return data.json();
							})
							.then(function(json) {
								if (json && json.replacedBy && json.replacedBy.length==1) {
									var newID = json.replacedBy[0].uuid;
									if (!newID) {
										console.error('replacedBy error for '+node.id+': '+updateURL,json);
										process.exit(1);
									}
									node[updateName] = newID;
								} else if (json && json['@id']) {
									// don't update
								} else {
									// non existing entity id
									node[updateName] = null; //FIXME: should check if it is a valid UUID and if so set entity.id to it (and update all links... jay)
									console.error('No replacement found:',updateURL);
								}
							});
						} else {
							node[updateName] = json[0].uuid;
						}
					}));
				},
				[]
			);
		}
	);

	var crawler = function() {
		var next = urlsToFetch.shift();
		if (!next) {
			Object.keys(update).forEach(function(type) {
				var source = sources[type];
				var fileData = JSON.stringify(source, null, "\t");
				fs.writeFileSync('./updated/'+files[type], fileData);
			});
		} else {
			console.log('fetching '+next.url);
			return fetch(next.url, next.headers)
			.then(function(data) {
				return data.json();
			})
			.then(function(json) {
				return next.resolve(json);
			})
			.then(function() {
				crawler();
			})
			.catch(function(error) {
				next.reject(error);
				crawler();
			});
		}
	}

	crawler();

