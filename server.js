// Import required modules
const express = require("express");
const puppeteer = require("puppeteer-core");

// Initialize the Express app
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Define a route for scraping data
app.post("/scrape", async (req, res) => {
    const { url } = req.body; // Expecting a JSON body with a `url` property

    if (!url) {
        return res.status(400).json({ error: "Missing 'url' in request body" });
    }

    try {
        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: '/usr/bin/chromium-browser', // Adjust path if needed
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded" }); // Navigate to the given URL

        // Evaluate the page to extract data
        const data = await page.evaluate(() => {
            const courses = Array.from(document.querySelectorAll(".courses li")).map(course => {
                const courseName = course.querySelector("h3") ? course.querySelector("h3").textContent.trim() : '';
                const courseCode = course.querySelector("h4") ? course.querySelector("h4").textContent.trim() : '';
                return { courseName, courseCode };
            });

            const languages = Array.from(document.querySelectorAll('.languages ul > li')).map(language => {
                const languageName = language.querySelector('h3') ? language.querySelector('h3').textContent.trim() : '';
                const languageDesccription = language.querySelector('h4') ? language.querySelector('h4').textContent.trim() : '';
                return { languageName, languageDesccription };
            });

            const educations = Array.from(document.querySelectorAll('.education ul > li')).map(education => {
                const educationName = education.querySelector('h3 a')
                    ? education.querySelector('h3 a').textContent.trim()
                    : education.querySelector('h3')
                        ? education.querySelector('h3').textContent.trim()
                        : '';
                const educationDescription = Array.from(education.querySelectorAll('h4 span')).map(span => span.textContent.trim()).join(' ');

                const educationStartDate = education.querySelector('p time:first-child') ? education.querySelector('p time:first-child').textContent : '';
                const educationEndDate = education.querySelector('p time:last-child') ? education.querySelector('p time:last-child').textContent : '';

                return { educationName, educationDescription, educationStartDate, educationEndDate };
            });

            const projects = Array.from(document.querySelectorAll('.projects ul > li')).map(project => {
                const projectName = project.querySelector('h3') ? project.querySelector('h3').textContent.trim() : '';
                const projectStartDate = project.querySelector('h4 time:first-child') ? project.querySelector('h4 time:first-child').textContent : '';
                const projectEndDate = project.querySelector('h4 time:last-child') ? project.querySelector('h4 time:last-child').textContent : '';
                const projectDescription = project.querySelector('p') ? project.querySelector('p').textContent.trim() : '';
                return { projectName, projectStartDate, projectEndDate, projectDescription };
            });

            const experiences = Array.from(document.querySelectorAll('.experience ul.experience__list > li')).map(experience => {
                // Check if the experience has grouped positions (experience-group)
                if (experience.classList.contains('experience-group')) {
                    const companyName = experience.querySelector('.experience-group-header h4') ? experience.querySelector('.experience-group-header h4').textContent.trim() : '';
                    const companyDuration = experience.querySelector('.experience-group-header p span.date-range span') ? experience.querySelector('.experience-group-header p span.date-range span').textContent.trim() : '';
            
                    // Loop through the positions inside the experience group
                    const positions = Array.from(experience.querySelectorAll('.experience-group__positions li')).map(position => {
                        const positionName = position.querySelector('h3 span.experience-item__title') ? position.querySelector('h3 span.experience-item__title').textContent.trim() : '';
                        const positionStartTime = position.querySelector('p.experience-item__meta-item:first-child span.date-range time:first-child') ? position.querySelector('p.experience-item__meta-item:first-child span.date-range time:first-child').textContent.trim() : '';
                        const positionEndTime = position.querySelector('p.experience-item__meta-item:first-child span.date-range time:nth-child(2)') ? position.querySelector('p.experience-item__meta-item:first-child span.date-range time:nth-child(2)').textContent.trim() : 'Today';
                        const positionTimeDuration = position.querySelector('p.experience-item__meta-item:first-child span span') ? position.querySelector('p.experience-item__meta-item:first-child span span').textContent.trim() : '';
                        const positionLocation = position.querySelector('p.experience-item__meta-item:last-child') ? position.querySelector('p.experience-item__meta-item:last-child').textContent.trim() : '';
            
                        // Returning the position data
                        return {
                            positionName,
                            positionStartTime,
                            positionEndTime,
                            positionTimeDuration,
                            positionLocation
                        };
                    });
            
                    // Returning the company data along with positions
                    return {
                        companyName,
                        companyDuration,
                        positions
                    };
                } else {
                    // Handling the case where it's a single experience without a group
                    const positionName = experience.querySelector('h3 > span.experience-item__title') ? experience.querySelector('h3 > span.experience-item__title').textContent.trim() : '';
                    const companyName = experience.querySelector('h4 span.experience-item__subtitle') ? experience.querySelector('h4 span.experience-item__subtitle').textContent.trim() : '';
                    const positionStartTime = experience.querySelector('p.experience-item__meta-item:first-child span.date-range time:first-child') ? experience.querySelector('p.experience-item__meta-item:first-child span.date-range time:first-child').textContent.trim() : '';
                    const positionEndTime = experience.querySelector('p.experience-item__meta-item:first-child span.date-range time:nth-child(2)') ? experience.querySelector('p.experience-item__meta-item:first-child span.date-range time:nth-child(2)').textContent.trim() : 'Today';
                    const positionTimeDuration = experience.querySelector('p.experience-item__meta-item:first-child span span') ? experience.querySelector('p.experience-item__meta-item:first-child span span').textContent.trim() : '';
                    const positionLocation = experience.querySelector('p.experience-item__meta-item:last-child') ? experience.querySelector('p.experience-item__meta-item:last-child').textContent.trim() : '';
            
                    // Returning the single position data within the same structure
                    return {
                        companyName,
                        positionTimeDuration,
                        positions: [{
                            positionName,
                            positionStartTime,
                            positionEndTime,
                            positionTimeDuration,
                            positionLocation
                        }]
                    };
                }
            });            

            return { courses, languages, projects, educations, experiences };
        })

        // Close the browser
        await browser.close();

        // Respond with the extracted data
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Scraping failed:", error);
        res.status(500).json({ success: false, error: "Scraping failed", details: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
