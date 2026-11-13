# Luma

Luma is my final project for CSE 340. I wanted to make a website I would actually use on a hard day. The idea is simple. You can take a moment to check in with yourself, find a gospel message that fits what you need, and write down one thing you’re grateful for.

[Try Luma on Render](https://luma-n86h.onrender.com/)

## How it works

When you sign in, Luma welcomes you by your first name. You can write how you feel, pick more than one feeling, or skip that question.

Then Luma asks what would help right now. If you pick something like peace or hope, it can show you a scripture, a quote, or a General Conference talk. You can save the message for later or remove it from your saved list.

You can also keep a private gratitude journal and go back to edit or delete your own entries.

## Who can do what

- **Members** can check in, save messages, write in their journal, and suggest a resource that helped them. They can see the status and review history of their own suggestions.
- **Contributors** can review suggestions, approve them, or ask for changes with feedback.
- **Admins** can also review suggestions. The admin dashboard for managing users, roles, and resources is planned.

## How the code is organized

Luma uses Node.js and Express for the server, EJS for the pages, and PostgreSQL for the database. It’s deployed on Render.

The gratitude journal is a good example of how I’m using MVC. Start with `src/routes/gratitude.js`, then follow it to the controller that handles the request and the model that talks to PostgreSQL.

[Leave feedback in GitHub Issues](https://github.com/ochoa07/luma/issues)

## What I’m working on next

I still need to finish the admin dashboard and connect approved suggestions to publishing. Before the final submission, I’ll add the database diagram and test account emails.