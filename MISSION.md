# EchoRush: Voice-Controlled Pediatric Speech Therapy

## What is EchoRush?
**EchoRush** is a modern, 3D hyper-casual endless runner game with a unique twist: **your voice is the controller.** 

EchoRush is specifically designed as a digital therapeutic tool for pediatric speech therapy. Instead of using a keyboard or touch screen, children navigate a vibrant, neon-lit 3D obstacle course using raw acoustic voice data. 

## Our Mission
Speech therapy for children often involves repetitive vocal exercises that can quickly become tedious, leading to a loss of engagement and slower progress. 

**Our mission is to gamify speech therapy, making it an exciting, rewarding, and highly engaging experience for children.** By translating specific vocal exercises into thrilling in-game actions, EchoRush encourages children to practice their speech mechanics (volume control, sustained phonation, and plosive articulation) naturally and enthusiastically.

## How It Works (Core Mechanics)
EchoRush uses real-time spectral analysis of the player's voice to trigger different abilities:

* **JUMP (Plosive Articulation):** A sharp, sudden sound (like a loud **"T!"** or **"P!"**) makes the player jump over hurdles. This practices sharp attack and high-frequency vocalizations.
* **SHIELD (Sustained Phonation - Moderate):** A steady, moderate-volume hum (like **"Mmmmm"**) activates a protective shield to smash through walls. This practices sustained vocal cord engagement and breath control.
* **BOOST (Sustained Phonation - Loud):** A loud, sustained yell (like **"AAAAH!"**) triggers a high-speed boost and a 2x score multiplier. This encourages vocal projection and sustained volume.

## Privacy & Technology First
EchoRush is built from the ground up with patient privacy and performance in mind:
* **Zero-Latency Gameplay:** We use the native Web Audio API and Fast Fourier Transform (FFT) for instantaneous audio analysis. 
* **100% Client-Side:** All audio processing happens locally on the device. 
* **No Speech-to-Text:** We do not use any transcription services or external APIs. The game listens for *frequencies and volume*, not words.
* **HIPAA Compliant by Design:** Because no audio is ever recorded, saved, or transmitted to any server, the application is inherently secure and respects patient privacy.
