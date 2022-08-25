import Curriculum from "curriculum-js";

async function validate() {
	var curriculum = new Curriculum();
	var schema = await curriculum.loadContextFromFile(
		"ldk-schema",
		"context.json"
	);
	var examenSchema = await curriculum.loadContextFromFile(
		"curriculum-basis",
		"curriculum-basis/context.json"
	);
	try {
		let result = await curriculum.validate(schema);
		console.log("Data is valid!");
	} catch (error) {
		error.validationErrors.forEach((error) => {
			console.log(error.instancePath + ": " + error.message);
		});
	}
}

validate();
