import Curriculum from 'curriculum-js'

async function validate() {

	var curriculum  = new Curriculum()
	var basisSchema = await curriculum.loadContextFromFile('curriculum-basis', 'curriculum-basis/context.json');
	var schema      = await curriculum.loadContextFromFile('curriculum-leerdoelenkaarten', 'context.json');
	try {
		let result = await curriculum.validate(schema)
		console.log('Data is valid!')
	} catch(error) {
		if (!error.validationErrors) {
			console.error(error)
		} else {
			error.validationErrors.forEach(error => {
				console.error(error.instancePath+': '+error.message)
			})
		}
	}
}

validate()
