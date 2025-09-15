todo: This is a good project for my use but
since I am not planning to use it for educational
purposes it should probably be adjusted

I have also changed my default project such as, to utilize the navigation plugin

this is a low priority task and not on the 5/25

# 11tyXploreTemplate - For practicing with 11ty 

This is a `practice` project, for building 11ty skills

## Pre-Requirements

1. Designed for VSCode - other IDEs may perform differently than documented here.
2. Expects a bash terminal - other terminals (powershell, anyone?) may run differently. 
Tested on windows with `git bash`
3. Expects relatively recent version of node and npm to be installed

If you don't already have a computer with VSCode, a bash terminal, and npm installed, you probably aren't ready for learning about something as weird and advanced as 11ty anyway.

11ty usage is typically limted to those developers that work with npm (or yarn or bun or ...) every day, as a part of their normal workflow. They are often called front end developers.

## An extra bonus may also present challenges

This project hides some complexity by hiding some files in VSCode - see [Missing files](__VSCODE_MISSING.md) for the TL;DR

## Usage

1. Clone `11tyXploreTemplate` into your workspace, as you would any other repository from github.
2. Copy to a practice project - using the virgin `11tyXploreTemplate` project only to make copies. See [Making and using copies](#make-and-use-copies-of-this-project-for-infinite-reps)

### It's easy. Allows for infinite reps!
- Make a new 11ty project
- Try something weird
- Scratch your head "Hmmm how did that happen?"
- Repeat - Now try other experiments! 
- Delete all the junk projects later. You learned a lot, and really fast!


## Make and use copies of this project for infinite reps

This 11ty stuff confuses the holy heck out of me - mostly because it does so much for me, and it's hard for me to guess what is what, if I want to study it piece by piece. 

So to really get an understanding of how it all works together, I might end up with a few dozen projects, created one at a time - 10 minutes or less per project, so I can try out stuff one experiment at a time, and do so really quickly. SSGs are weird, and take some time to get used to - or at least, that is my experience

My workspace gets pretty littered pretty fast - but that is easy to clean up later once I get my reps in. So it might look like this - [your naming convention might vary]

- 11tyXploreTemplate
- aa
- ab
- ac
- ad
- ae
- af
- etc

Prefixing all my junk experiments with the same letter keeps them in one place in the folder for easy deletion later.

### To make a `foo` or `bar` project 

[assumes a bash terminal see above]

This command: `./copy.sh foo` (from inside `11tyXploreTemplate`)

Now you can open the `foo` directory as a folder inside VSCode and it will be ready to create and test a new SSG site, using 11ty.

