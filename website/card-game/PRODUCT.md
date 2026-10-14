# Lumara · Last Light

A casual card game for Lumara friends to play after a retrospective. Users choose an existing companion, create or join a private room, and play the familiar survival card game. A four-seat offline bot practice round is available without hosting.

The user requested the existing Exploding Kittens mechanics and explicitly prefers cute chibi illustrations with playful comic expressions. Character identities come from the project's original Lumara art; the generated pictures are original scenes. Character selection changes appearance only.

Original mode has 2–5 seats and the base card set. Party Pack mode has 2–10 seats and its additional effects. Official publisher instructions are the rules authority; RULES.md records the mapping and explicit ten-second online interruption window.

This is a standalone React/TypeScript website with a Node/boardgame.io multiplayer server. It inherits the parent website's visual system. The work stays local until publishing is authorized. It does not access the retrospective database, store check-in answers, or modify the main Lumara game.

Current rooms use memory storage and disappear on server restart. Durable persistence, production room moderation, quotas, and public load testing are outside this prototype. Static hosting supports offline practice; shared online rooms require the Node server and WebSocket support.
