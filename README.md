# Auto Note Mover

Auto Note Mover will automatically move the active notes to their respective folders according to the rules.

## How it works

Register the tag or title of the note you want to move to the rule.

When the active note matches the rule, Auto Note Mover will move the note to the destination folder.

If you create a new note from a link in an existing note or from another plugin, Auto Note Mover will move those notes to the folder you want, so you don't have to worry about where or how to create the note.

If the rule is matched but the destination folder is not found, or if the destination folder has a note with the same name, a warning will be displayed and the move will be aborted.

## Triggers

There are two types of triggers for Auto Note Mover.

### Automatic

Triggered when you create, edit, or rename a note, and moves the note if it matches the rules.

You can also activate the trigger with a command.

### Manual

Will not automatically move notes.

You can trigger by command.

## Rules

1. Set the destination folder.
2. Set a tag or title that matches the note you want to move. **You can set either the tag or the title.**
3. The rules are checked in order from the top. The notes will be moved to the folder with the **first matching rule.**

Tag: Be sure to add a **\#** at the beginning.

Title: Tested by JavaScript regular expressions.

## Notice

1. Attached files will not be moved, but they will still appear in the note.
2. Auto Note Mover will not move notes that have "**AutoNoteMover: disable**" in the frontmatter.

## Example of use

### Tag
![Food0](https://user-images.githubusercontent.com/33874906/152721614-45a65095-3af2-4e80-8973-26be686ca585.png)

![Food2](https://user-images.githubusercontent.com/33874906/152721697-7cf722fc-bc82-4c5d-8bbe-6c087755d29c.png)

### Nested Tag
![nest0](https://user-images.githubusercontent.com/33874906/152721876-58b19020-eb75-4324-a8ba-2110dba11ea6.png)

![nest1](https://user-images.githubusercontent.com/33874906/152721897-be270fc9-6381-46b6-99d0-1d5a08260a06.png)

### Daily Notes
![day0](https://user-images.githubusercontent.com/33874906/152721914-48ed5cc5-ec08-4f80-9425-8c68b719107a.png)

![day1](https://user-images.githubusercontent.com/33874906/152721927-659d0ad4-ce9f-4aea-8752-8eb668500af5.png)

### Task Notes
![task0](https://user-images.githubusercontent.com/33874906/152723161-6a8d9999-15e9-4e97-8b71-e07ff30fb330.png)

![task1](https://user-images.githubusercontent.com/33874906/152723175-839e724c-4437-42ff-ba05-f458e45c3f21.png)

### Star Notes
![sta0](https://user-images.githubusercontent.com/33874906/152721996-74f29153-4266-4aff-88e6-e765ef031d65.png)

![sta1](https://user-images.githubusercontent.com/33874906/152722006-54f5c315-8d5b-457b-8cfc-ec982a2b088c.png)

### How to Notes
![how0](https://user-images.githubusercontent.com/33874906/152722040-e100961b-8398-485d-bc64-f3fa784b79be.png)

![how1](https://user-images.githubusercontent.com/33874906/152722054-820441a1-a244-43cb-b8f2-fcde06310d40.png)

### Command
![comm](https://user-images.githubusercontent.com/33874906/152723205-70599951-75ee-4915-a160-17a3faed67b0.png)

### Disable Auto Note Mover in front matter.
![fm0](https://user-images.githubusercontent.com/33874906/152722074-d550e13c-2955-40ab-b324-7e934d86ea1a.png)


## Attribution
suggest.ts and file-suggest.ts are copyrighted works of Liam Cain (https://github.com/liamcain) obsidian-periodic-notes (https://github.com/liamcain/obsidian-periodic-notes).

popper.js https://popper.js.org/
