class whatIsJeopardy {
    constructor(element, options = {}) {

        //Database
        this.categories = [];
        this.clues = {};
        //State
        this.currentClue = null;
        this.score = 0;
        //Elements
        this.boardElement = element.querySelector('.board');
        this.scourCountElement = element.querySelector('.score-count');
        this.formElement = element.querySelector('form');
        this.inputElement = element.querySelector('input[name=user-answer]');
        this.modalElement = element.querySelector('.card-modal');
        this.clueTextElement = element.querySelector('.clue-text');
        this.resultElement = element.querySelector('.result');
        this.resultTextElement = element.querySelector('.result_correct-answer-text');
        this.successTextElement = element.querySelector('.result_success');
        this.failTextElement = element.querySelector('.result_fail');
    }

    initGame() {
        //Bind event handlers
        this.boardElement.addEventListener('click', event => {
            if (event.target.dataset.clueId) {
                this.handleClueClick(event);
            }
        });
        this.formElement.addEventListener('submit', event => {
            this.handleFormSubmit(event)
        });
        //Render initial state of score
        this.updateScore(0);
        //Kick off the category fetch
        this.fetchCategories();
    }

    fetchCategories() {
        const MAX_REQUESTS = 5; // Fetch 5 categories
        let requestsMade = 0;

        const fetchNextCategory = () => {
            if (requestsMade >= MAX_REQUESTS) {
                // Fetched the desired number of categories, stop fetching
                return;
            }

            const randomCategoryId = Math.floor(Math.random() * 18418) + 1; // Generate a random category ID within the valid range

            fetch(`https://jservice.io/api/category?id=${randomCategoryId}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Request failed with status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    requestsMade++;

                    // Start processing the fetched category
                    let category = {
                        title: data.title,
                        clues: [],
                    };
                    // Add every clue within a category to our database of clues
                    let clues = shuffle(data.clues).splice(0, 5).forEach((clue, index) => {
                        console.log(clue);
                        // Create a unique ID for this clue
                        let clueId = index + '-' + data.id;
                        category.clues.push(clueId);

                        // Add clue to DB
                        this.clues[clueId] = {
                            question: clue.question,
                            answer: clue.answer,
                            value: (index + 1) * 100,
                        };
                    });
                    // Add this category to our DB of categories
                    this.categories.push(category);
                    // render the category
                    this.renderCategory(category);

                    // Move on to the next category
                    fetchNextCategory();
                })
                .catch((error) => {
                    // Handle errors gracefully
                    console.error(`Error fetching category: ${error.message}`);
                    // Move on to the next category
                    fetchNextCategory();
                });
        };

        // Start fetching the first category
        fetchNextCategory();
    }

    renderCategory(category) {
        console.log('Rendering category:', category);
        let column = document.createElement('div');
        column.classList.add('column');
        column.innerHTML = (
            `<header>${category.title}</header>
            <ul>
            </ul>`
        ).trim();

        let ul = column.querySelector('ul');
        category.clues.forEach(clueId => {
            let clue = this.clues[clueId];
            ul.innerHTML += `<li><button data-clue-id=${clueId}>${clue.value}</button></li>`
        })
        // add to DOM
        this.boardElement.appendChild(column);
    }





    updateScore(change) {
        this.score += change;
        this.scourCountElement.textContent = this.score;
    }

    handleClueClick(event) {
        let clue = this.clues[event.target.dataset.clueId];
        // mark this button as used
        event.target.classList.add('used');

        //clear out the input field
        this.inputElement.value = "";

        // update current clue
        this.currentClue = clue;

        // update the text
        this.clueTextElement.textContent = this.currentClue.question;
        this.resultTextElement.textContent = this.currentClue.answer;

        // hide the result
        this.modalElement.classList.remove('showing-result');

        //show the modal
        this.modalElement.classList.add('visible');
        this.inputElement.focus();
    }

    // handle an answer from user
    handleFormSubmit(event) {
        event.preventDefault();

        // define the expected answer format
        const expectedFormat = "What is ";
        // check if the user's answer starts with the expected format
        if (this.inputElement.value.toLowerCase().startsWith(expectedFormat.toLocaleLowerCase())) {
            // remove the expected format from the user's answer
            let userAnswer = this.inputElement.value.substring(expectedFormat.length).trim();



            let isCorrect = this.cleanseAnswer(userAnswer) ===
                this.cleanseAnswer(this.currentClue.answer);
            if (isCorrect) {
                this.updateScore(this.currentClue.value);
            }

            // show answer
            this.revealAnswer(isCorrect);
        } else {
            alert('Please answer in the format "What is  ...')
        }
    }

    // standardize an answer string so we can compare and accept variations
    cleanseAnswer(input = '') {
        let friendlyAnswer = input.toLowerCase();
        friendlyAnswer = friendlyAnswer.replace("<i>", "");
        friendlyAnswer = friendlyAnswer.replace("</i>", "");
        friendlyAnswer = friendlyAnswer.replace(/ /g, "");
        friendlyAnswer = friendlyAnswer.replace(/"/g, "");
        friendlyAnswer = friendlyAnswer.replace(/^a /, "");
        friendlyAnswer = friendlyAnswer.replace(/^an /, "");
        return friendlyAnswer.trim();
    }

    revealAnswer(isCorrect) {
        // show the individual success/fail case
        this.successTextElement.style.display = isCorrect ? "block" : "none";
        this.failTextElement.style.display = !isCorrect ? "block" : "none";

        //Show the whole result container
        this.modalElement.classList.add("showing-result");

        //Disappear after a short bit
        setTimeout(() => {
            this.modalElement.classList.remove("visible");
        }, 3000);
    }
}
//Utils -----------------------------------
/*https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 Shuffles array in place.
  @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
} //https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array

//-------------------------------------------

const game = new whatIsJeopardy(document.querySelector(".app"), {});
game.initGame();