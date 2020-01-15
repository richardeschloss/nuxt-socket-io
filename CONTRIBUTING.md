# Contributing

Want to contribute? I think that's fantastic! This project is used all over the world and your help is appreciated! Here are some basic guidelines for contributing.

1. First, *fork* this repo (click the button at the top right on Github)
2. Only push changes to your repo, and when you feel your changes are ready to be merged, open a pull request.
3. Because this project is tied into a CI/CD system that runs when branches are pushed to it, I ask that you please avoid asking changes to be merged directly into the master branch. Ideally, I ask that you merge request into `[main project repo]:development` branch, or better yet, into the same branch name `[main project repo]:your-feature <-- [your project repo]:your-feature`. This way, the CI pipeline should kick-off the moment you open the pull request, and won't worry the user base if the test fails (since the test wouldn't be failing on master / released code).
4. For simple documentation changes, such as changes to README.md, please submit the merge request to `gh-pages`. That branch will host the documentation on github pages.
5. Code changes should be tested and accompanied with automated tests that get coverage on all added cases. If it is difficult to obtain 100% coverage, please ask for help and I will try to help. If still too difficult, we'll simply add a note about manually testing that was done. If others want to help too, I'll try my best to credit everyone who does!
