const electron = require("electron"); // Connect to Electron Library.
const remote = electron.remote; // Electron Remote object (equivalent to background electron process)
const ipcRenderer = electron.ipcRenderer; // Electron IPC renderer for x-window communication.
document.electron = electron; // Connect Electron to the global variable.
body_object = document.getElementsByTagName('BODY')[0]

delete window.Notification;

function forceInteraction(element, type = "click", query = false) { // Force a click interaction with an element.
	if (query) {
		object = document.querySelector(element);
	} else {
		object = element;
	}
	
	if (!object)
		return;

	object[type in object ? type : "click"]();
}

function last(array, n) { // Get the last element of an array.
	if (array == null) return void 0; 
	if (n == null) return array[array.length - 1]; 
	return array.slice(Math.max(array.length - n, 0)); 
}

function hasClass(element, class_name) { // Return Boolean representing whether or not an element has a class set.
	if ( (" " + element.className + " ").replace(/[\n\t]/g, " ").indexOf(' ' + class_name + ' ') > -1 ) {
		return true;
	} else {
		return false;
	}
}

function getRandomInt(min, max) { // Get a Random Integer between two values.
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

function sleep(ms) { // Sleep program for a given amount of time.
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function advanceQuestion() { // Advance Question Pane.
	advances = document.getElementsByClassName('next active')
	forceInteraction(advances[0])
}

async function vocabQuestion() {
	questionPanes = document.getElementsByClassName('questionPane');

	if (questionPanes.length >= 1) {
		questionPane = questionPanes[0];
		containers = questionPane.getElementsByClassName('challenge-slide');
		currentContainer = last(containers);

		if (hasClass(currentContainer, 'summary')) {
			await sleep(1000);
			advanceQuestion();
		} else {
			currentQuestion = currentContainer.getElementsByClassName('question')[0]

			choiceQuestions = currentQuestion.getElementsByClassName('choices');
			textQuestions = currentQuestion.getElementsByClassName('spelltheword');

			questionContent = currentQuestion.getElementsByClassName('questionContent');

			if (textQuestions.length == 1) {
				fieldLeft = textQuestions[0].getElementsByClassName('field left')[0];
				input = fieldLeft.getElementsByClassName('wordspelling')[0];
				fieldRight = textQuestions[0].getElementsByClassName('field right')[0];
				submit = fieldRight.getElementsByClassName('spellit')[0];
				giveUp = fieldRight.getElementsByClassName('surrender')[0];
				complete_instances = currentQuestion.getElementsByClassName('sentence complete');
				
				if (complete_instances.length >= 1) {
					guess_value_holder = complete_instances[0].getElementsByTagName('STRONG')[0];
					input.value = guess_value_holder.innerText || guess_value_holder.textContent;
				} else {
					if (textList.length >= 1) {
						input.value = textList[Math.floor(Math.random()*textList.length)];
					} else {
						input.value = 'I don\'t want to answer this question';
					}
				}
				
				await sleep(500);
					forceInteraction(submit);

				if (hasClass(currentContainer, 'correct')) {
					advanceQuestion();
				} else {
					adata = currentContainer.getAttribute('data-adata');
					adata_array = JSON.parse(adata);
					possible_value = adata_array['acceptedAnswers'][0];
					input.value = possible_value;
					forceInteraction(submit);

					if (hasClass(currentContainer, 'correct')) {
						textList.push(possible_value);
						await sleep(500);
						advanceQuestion();
					} else {
						forceInteraction(submit);
						await sleep(100);
						forceInteraction(submit);
						await sleep(100);
						forceInteraction(giveUp);
						await sleep(500);
						advanceQuestion();
					}	
				}
			} else if (choiceQuestions.length == 1) {
				answers = choiceQuestions[0].children;
				success = false;
				guess = true;

				if (guess) {
					definitions = currentContainer.getElementsByClassName('def');
					if (definitions.length >= 1) {
						definition = definitions[0];
						words = definition.getElementsByTagName('SPAN');

						if (words.length >= 1) {
							word = words[0];
							wordContent = word.innerText || word.textContent;

							for (i = 0; i < 4; i++) {
								answer = answers[i];
								answerText = answer.innerText || answer.textContent;
								answerWords = answerText.split(' ');

								if (answerWords.includes(wordContent)) {
									forceInteraction(answer);

									await sleep(250);

									if (hasClass(currentContainer, 'correct')) {
										success = true;
									}

									await sleep(200);

									advanceQuestion();
								}
							}
						}
					}
				}

				if (!success) {
					forceInteraction(answers[getRandomInt(0,3)]);

					await sleep(450);

					if (hasClass(currentContainer, 'correct')) {
						advanceQuestion();
					} else {
						adata = currentContainer.getAttribute('data-adata');

						if (adata != null) {
							try {
								adata = currentContainer.getAttribute('data-adata');
								adata_array = JSON.parse(adata);

								answerOrder = String(adata_array['answerOrder']);
								orderArray = answerOrder.split('');
								correct_answer = orderArray.indexOf('1')

								forceInteraction(answers[correct_answer]);

								await sleep(200);
								advanceQuestion();
							} catch(err) {
								advanceQuestion();
							}
						}
					}
				}
			} else {
				await sleep(1000);
				advanceQuestion();
			}
		}
	}
}

setInterval(vocabQuestion, 2150); // Run the vocabQuestion function every 2.15 seconds.

setTimeout(advanceQuestion, 1000); // Advance the question 1 second after starting in case of bad initialization.

ipcRenderer.on('hoverOn', () => {
	document.getElementsByTagName('BODY')[0].className += ' hover'
});

ipcRenderer.on('hoverOff', () => {
	document.getElementsByTagName('BODY')[0].className = document.getElementsByTagName('BODY')[0].className.replace(/(?:^|\s)hoverMode(?!\S)/g,'');
});