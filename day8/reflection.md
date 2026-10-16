# Reflection

The most difficult concept for me was estimating capacity for a system with both ordinary traffic and sudden peaks. I found it challenging to understand how a service that handles modest average traffic could still struggle when many people act at once. I overcame this by writing down my assumptions and converting daily totals and the ten-minute concert-sale scenario into requests per second. Comparing the rates helped me identify where a queue and careful database writes would be important.

Based on the feedback I received on my capstone, I would improve the technical explanation of my design decisions. I would make the architecture diagram clearer, explain why I selected each technology, and give stronger justification for those choices. I would also make the capacity estimates more evidence-based and describe more concretely how the system handles high traffic, failures, and concurrent requests. This would make the design more practical and easier to understand.

Next, I want to learn how to build backend services that use database transactions and handle concurrent requests safely. I would like to implement a small reservation system and test what happens when multiple users try to claim the same item, as well as when a payment or service fails. That would help me connect the design concepts from this course to a reliable working application.
