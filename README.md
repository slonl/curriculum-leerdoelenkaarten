# curriculum-leerdoelenkaarten: SLO Curriculum extra dataset (ldk.vakkern, ldk.vakkernen, ldk.vaksubkernen and ldk.vakinhouden)

This repository contains the courses curriculum dataset. The dataset is defined by the `context.json` JSON Schema file. The repository also contains the dataset (https://github.com/slonl/curriculum-inhouden/) as a submodule.

## installation

```
git clone --recurse-submodules https://github.com/slonl/curriculum-leerdoelenkaarten
cd curriculum-leerdoelenkaarten
npm install
```

You can validate the dataset by running the test command:

```
npm test
```

## contents

This dataset contains the following collections:

- ldk_vak: A list of the main courses.
- ldk_vakkern: A list of core topics in the courses.
- ldk_vaksubkern: A list of sub topics in the courses.
- ldk_vakinhoud: A list of granular topics in the courses.
- ldk_deprecated: A list of deprecated entities

The dataset extends the curriculum doelen and inhouden datasets and should be used together with them. Entities in this dataset reference entities in the core datasets. The rules for the core datasets also apply to this dataset, so go read the core dataset Readmes as well.

## validating the data

Running the test script validates the dataset:

```
npm test
```
