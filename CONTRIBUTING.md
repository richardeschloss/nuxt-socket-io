# Contributing

Want to contribute? I think that's fantastic! This project is used all over the world and your help is appreciated! Here are some basic guidelines for contributing.

## Have a question or an issue?

1. I highly recommend reading this article first: [Writing the Perfect Question by Jon Skeet](https://codeblog.jonskeet.uk/2010/08/29/writing-the-perfect-question/). 
2. It helps both of us when you have a done a decent amount of homework already and have reached a point where you can ask a very specific question. It helps when the specific question is accompanied by tiny code snippets. 
3. It is possible that the tested codebase can still not meet people's expectations, so, when opening an issue, please try to keep the issue focused and bite-sized. This makes issues easier for me to address, and also makes it easier for readers to follow. This will also make the git history easier to follow to, such as "development <-- feat/chatRooms". 
4. Please try to avoid opening issues when it is instead a slew of general questions you intend to ask. There has been a considerable amount of work poured into the documentation and a lot of general questions can be answered there. If you require more help, you can usually ping me in the Nuxt discord chat rooms. Ideally, if the general issues can be organized into *real* issues with the actual plugin, that makes the issues easier to address. The problem with opening non-real issues is that 1) it causes the issue count to go up on the project repo and potentially alarm new visitors to the project page (when the issue may not be real) and 2) causes me to step away from whatever real progress I am making so that I can answer the question. 
5. If you do open an issue, this can also be *your* chance to shine! Most of the code is in `io/plugin.js`. If you do have an issue, maybe you can solve your issue before I even read it! If so, you can have a chance to get your feature or bugfix merged in!

## Want to merge in your awesome code?

Great! Here are the steps to help make the process go smoothly:

1. First, *fork* this repo (click the button at the top right on Github). Always work out of your fork please. This way, if something goes wrong in your fork, you can always refer back to the main project.
2. Only push changes to your repo, and when you feel your changes are ready to be merged, open a pull request.
3. Because this project is tied into a CI/CD system that runs when branches are pushed to it, I ask that you please avoid asking changes to be merged directly into the master branch. Ideally, I ask that you merge request into `[main project repo]:development` branch, or better yet, into the same branch name `[main project repo]:your-feature <-- [your project repo]:your-feature`. This way, the CI pipeline should kick-off the moment you open the pull request, and won't worry the user base if the test fails (since the test wouldn't be failing on master / released code).
4. For simple documentation changes, such as changes to README.md, please submit the merge request to `gh-pages`. That branch will host the documentation on github pages.
5. Code changes should be tested and accompanied with automated tests that get coverage on all added cases. Tests use the ava test framework. If it is difficult to obtain 100% coverage, please ask for help and I will try to help. If still too difficult, we'll simply add a note about manually testing that was done. If others want to help too, I'll try my best to credit everyone who does!
