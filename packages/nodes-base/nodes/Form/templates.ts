import type { FormField } from './interfaces';

const n8nLogo = `
<svg width="73" height="20" viewBox="0 0 73 20" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path fill-rule="evenodd" clip-rule="evenodd" d="M40.2373 4C40.2373 6.20915 38.4464 8 36.2373 8C34.3735 8 32.8074 6.72525 32.3633 5H26.7787C25.801 5 24.9666 5.70685 24.8059 6.6712L24.6415 7.6576C24.4854 8.59415 24.0116 9.40925 23.3417 10C24.0116 10.5907 24.4854 11.4058 24.6415 12.3424L24.8059 13.3288C24.9666 14.2931 25.801 15 26.7787 15H28.3633C28.8074 13.2747 30.3735 12 32.2373 12C34.4464 12 36.2373 13.7908 36.2373 16C36.2373 18.2092 34.4464 20 32.2373 20C30.3735 20 28.8074 18.7253 28.3633 17H26.7787C24.8233 17 23.1546 15.5864 22.8331 13.6576L22.6687 12.6712C22.508 11.7069 21.6736 11 20.6959 11H19.0645C18.5652 12.64 17.0406 13.8334 15.2373 13.8334C13.434 13.8334 11.9094 12.64 11.4101 11H9.06449C8.56519 12.64 7.04059 13.8334 5.2373 13.8334C3.02817 13.8334 1.2373 12.0424 1.2373 9.83335C1.2373 7.6242 3.02817 5.83335 5.2373 5.83335C7.16069 5.83335 8.76699 7.19085 9.15039 9H11.3242C11.7076 7.19085 13.3139 5.83335 15.2373 5.83335C17.1607 5.83335 18.767 7.19085 19.1504 9H20.6959C21.6736 9 22.508 8.29315 22.6687 7.3288L22.8331 6.3424C23.1546 4.41365 24.8233 3 26.7787 3H32.3633C32.8074 1.27478 34.3735 0 36.2373 0C38.4464 0 40.2373 1.79086 40.2373 4ZM38.2373 4C38.2373 5.10455 37.3419 6 36.2373 6C35.1327 6 34.2373 5.10455 34.2373 4C34.2373 2.89543 35.1327 2 36.2373 2C37.3419 2 38.2373 2.89543 38.2373 4ZM5.2373 11.8334C6.34189 11.8334 7.23729 10.9379 7.23729 9.83335C7.23729 8.72875 6.34189 7.83335 5.2373 7.83335C4.13273 7.83335 3.2373 8.72875 3.2373 9.83335C3.2373 10.9379 4.13273 11.8334 5.2373 11.8334ZM15.2373 11.8334C16.3419 11.8334 17.2373 10.9379 17.2373 9.83335C17.2373 8.72875 16.3419 7.83335 15.2373 7.83335C14.1327 7.83335 13.2373 8.72875 13.2373 9.83335C13.2373 10.9379 14.1327 11.8334 15.2373 11.8334ZM32.2373 18C33.3419 18 34.2373 17.1045 34.2373 16C34.2373 14.8954 33.3419 14 32.2373 14C31.1327 14 30.2373 14.8954 30.2373 16C30.2373 17.1045 31.1327 18 32.2373 18Z" fill="#EA4B71"/>
	<path d="M44.2393 15.0007H46.3277V10.5791C46.3277 9.12704 47.2088 8.49074 48.204 8.49074C49.183 8.49074 49.9498 9.14334 49.9498 10.4812V15.0007H52.038V10.057C52.038 7.91969 50.798 6.67969 48.8567 6.67969C47.633 6.67969 46.9477 7.16914 46.4582 7.80544H46.3277L46.1482 6.84284H44.2393V15.0007Z" fill="#101330"/>
	<path d="M60.0318 9.50205V9.40415C60.7498 9.0452 61.4678 8.4252 61.4678 7.20155C61.4678 5.43945 60.0153 4.37891 58.0088 4.37891C55.9528 4.37891 54.4843 5.5047 54.4843 7.23415C54.4843 8.4089 55.1698 9.0452 55.9203 9.40415V9.50205C55.0883 9.79575 54.0928 10.6768 54.0928 12.1452C54.0928 13.9237 55.5613 15.1637 57.9923 15.1637C60.4233 15.1637 61.8428 13.9237 61.8428 12.1452C61.8428 10.6768 60.8638 9.81205 60.0318 9.50205ZM57.9923 5.87995C58.8083 5.87995 59.4118 6.40205 59.4118 7.2831C59.4118 8.16415 58.7918 8.6863 57.9923 8.6863C57.1928 8.6863 56.5238 8.16415 56.5238 7.2831C56.5238 6.38575 57.1603 5.87995 57.9923 5.87995ZM57.9923 13.5974C57.0458 13.5974 56.2793 12.9937 56.2793 11.9658C56.2793 11.0358 56.9153 10.3342 57.9758 10.3342C59.0203 10.3342 59.6568 11.0195 59.6568 11.9984C59.6568 12.9937 58.9223 13.5974 57.9923 13.5974Z" fill="#101330"/>
	<path d="M63.9639 15.0007H66.0524V10.5791C66.0524 9.12704 66.9334 8.49074 67.9289 8.49074C68.9079 8.49074 69.6744 9.14334 69.6744 10.4812V15.0007H71.7629V10.057C71.7629 7.91969 70.5229 6.67969 68.5814 6.67969C67.3579 6.67969 66.6724 7.16914 66.1829 7.80544H66.0524L65.8729 6.84284H63.9639V15.0007Z" fill="#101330"/>
	</svg>
`;

const spinnerIcon = `
<svg xmlns="http://www.w3.org/2000/svg" height="18px"
	viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
	<path
		d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z" />
</svg>`;

const styles = `
*,
::after,
::before {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
}

body {
	font-family: Open Sans, sans-serif;
	font-weight: 400;
	font-size: 12px;
	display: flex;
	flex-direction: column;
	justify-content: start;
	background-color: #FBFCFE;
}

.container {
	margin: auto;
	text-align: center;
	padding-top: 24px;
	width: 448px;
}

.test-notice {
	padding: 12px 24px;
	color: #E6A23D;
	background-color: #FEFAF6;
	border-radius: 8px;
	border: 1px solid #F6DCB7;
	font-size: 12px;
	font-weight: 400;
	line-height: 16px;
	text-align: left;
	margin-bottom: 16px;
}

.card {
	padding: 24px;
	background-color: white;
	border: 1px solid #DBDFE7;
	border-radius: 8px;
	box-shadow: 0px 4px 16px 0px #634DFF0F;
	margin-bottom: 16px;
}

.n8n-link a {
	color: #7E8186;
	font-weight: 600;
	font-size: 12px;
	text-decoration: none;
}

.n8n-link svg {
	display: inline-block;
	vertical-align: middle;
}

.form-header h1 {
	color: #525356;
	font-size: 20px;
	font-weight: 400;
}

.form-header p {
	padding-top: 8px;
	color: #7E8186;
	font-size: 14px;
	font-weight: 400;
}

.inputs-wrapper {
	padding-top: 24px;
	padding-bottom: 24px;
}

form label {
	display: block;
	text-align: left;
	font-size: 14px;
	font-weight: 600;
	color: #555555;
	padding-bottom: 6px;
}

form .form-input {
	border: 1px solid #DBDFE7;
	border-radius: 6px;
	width: 100%;
	font-size: 14px;
	color: #909399;
	font-weight: 400;
	padding: 12px;
}

form input:focus {
	outline: none;
	border-color: rgb(90, 76, 194);
}

.select-input {
	border: 1px solid #DBDFE7;
	border-radius: 6px;
}

.select-input:focus-within {
	border: 1px solid rgb(90, 76, 194);
}

form select {
	outline: transparent;
	border: none;
	border-radius: 6px;
	width: 100%;
	font-size: 14px;
	color: #909399;
	font-weight: 400;
	background-color: white;
	padding: 12px;
	border-right: 12px solid transparent;
}

input[type="date"] {
	font-family: Open Sans, sans-serif;
}

#submit-btn {
	width: 100%;
	height: 48px;
	padding: 12px;
	border-radius: 6px;
	border: 0;
	font-size: 14px;
	font-weight: 600;
	font-family: Open Sans, sans-serif;
	background-color: #FF6D5A;
	color: #FFFFFF;
	cursor: pointer;
}

#submit-btn span {
	padding-right: 6px;
	display: none;
}

#submit-btn span svg {
	display: inline-block;
	vertical-align: middle;
	fill: #FFFFFF;
	animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

@keyframes lds-ring {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

#submit-btn:hover {
	opacity: 0.7;
}

.error-hidden {
	display: block;
	position: relative;
	color: #EA1F30;
	text-align: left;
	font-size: 12px;
	font-weight: 400;
	visibility: hidden;
	padding-top: 6px;
	padding-bottom: 9px;
}

.error-show {
	visibility: visible;
}

/* multiselect ----------------------------------- */
.multiselect {
	padding-left: 6px;
	padding-right: 6px;
}

.multiselect-option {
	padding-top: 6px;
	display: flex;
}

.multiselect-option label {
	padding-left: 12px;
	color: #7E8186;
	font-weight: 400;
	cursor: pointer;
}

.multiselect-checkbox {
	vertical-align: middle;
}

input[type="checkbox"] {
	width: 18px;
	height: 18px;
	cursor: pointer;
}
`;

const testNotice = `
<div class="test-notice">
<p>
	This is test version of your form. Use it only for testing your Form Trigger.
</p>
</div>
`;

const automatedWith = (instanceId?: string) => {
	const utm_campaign = instanceId ? `&utm_campaign=${instanceId}` : '';
	return `
	<div class="n8n-link">
	<a href="https://n8n.io/?utm_source=n8n-internal&utm_medium=form-trigger${utm_campaign}" target="_blank">
		Form automated with ${n8nLogo}
	</a>
	</div>
	`;
};

const submittedTestMessage = (formSubmittedText: string | undefined) => {
	let submittedContent = `
		<p id="submitted-content">
			${formSubmittedText === undefined ? 'Your response has been recorded' : formSubmittedText}
		</p>
	`;

	if (formSubmittedText === '') {
		submittedContent = '';
	}
	return `
	<div class="card" id="submitted-form" style="display: none;">
	<div class="form-header">
		<h1 id="submitted-header">Form Submited</h1>
		${submittedContent}
	</div>
	</div>
	`;
};

const addMultiselectInput = (field: FormField, fieldIndex: string) => {
	const fieldOptions = field.fieldOptions?.values ?? [];

	let dropdownOptions = '';

	for (const [index, entry] of fieldOptions.entries()) {
		const optionIndex = `option${index}`;
		dropdownOptions += `
		<div class="multiselect-option">
			<input type="checkbox" class="multiselect-checkbox" id="${optionIndex}" />
			<label for="${optionIndex}">${entry.option}</label>
		</div>
		`;
	}

	return `
	<div>
		<label class="form-label">Multiselect Options</label>
		<div class="multiselect" id="${fieldIndex}">
			${dropdownOptions}
		</div>
	`;
};

const prepareFormGroups = (formFields: FormField[]) => {
	let formHtml = '';
	let variables = '';
	let validationCases = '';

	for (const [index, field] of formFields.entries()) {
		const { fieldType, requiredField, multiselect } = field;
		const fieldIndex = `field-${index}`;
		const required = requiredField ? 'required' : '';

		if (multiselect) {
			formHtml += addMultiselectInput(field, fieldIndex);
		} else if (fieldType === 'dropdown') {
			const fieldOptions = field.fieldOptions?.values ?? [];

			formHtml += '<div class="form-group">';
			formHtml += `<label class="form-label" for="${fieldIndex}">${field.fieldLabel}</label>`;
			formHtml += '<div class="select-input">';
			formHtml += `<select id="${fieldIndex}" name="${fieldIndex}" ${required}>`;
			formHtml += '<option value="" disabled selected>Select an option ...</option>';
			for (const entry of fieldOptions) {
				formHtml += `<option value="${entry.option}">${entry.option}</option>`;
			}
			formHtml += '</select>';
			formHtml += '</div>';
		} else {
			formHtml += '<div class="form-group">';
			formHtml += `<label class="form-label" for="${fieldIndex}">${field.fieldLabel}</label>`;
			formHtml += `<input class="form-input" type="${fieldType}" id="${fieldIndex}" name="${fieldIndex}" ${required}/>`;
		}

		formHtml += `
		<p class="error-${fieldIndex} error-hidden">
			This field is required
		</p>`;

		formHtml += '</div>';

		if (multiselect) {
			const input = `input${index}`;
			variables += `
				const ${input} = document.querySelector(\`#${fieldIndex}\`);
			`;
			if (requiredField) {
				variables += `
					const error${index} = document.querySelector(\`.error-${fieldIndex}\`);

					${input}.addEventListener('click', () => {
						validateMultiselect(${input}, error${index});
					});
				`;
			}
		}

		if (requiredField) {
			if (multiselect) {
				validationCases += `
				valid.push(validateMultiselect(input${index}, error${index}));
				`;
			} else {
				variables += `
					const input${index} = document.querySelector(\`#${fieldIndex}\`);
					const error${index} = document.querySelector(\`.error-${fieldIndex}\`);
					input${index}.addEventListener('blur', () => {
						validateInput(input${index}, error${index});
					});
					input${index}.addEventListener('input', () => {
						error${index}.classList.remove('error-show');
				});
				`;

				validationCases += `
				valid.push(validateInput(input${index}, error${index}));
				`;
			}
		}
	}

	return { formHtml, variables, validationCases };
};

const createForm = (formTitle: string, formDescription: string, form: string) => {
	return `
	<form class="card" action='#' method='POST' name='n8n-form' id='n8n-form' novalidate>
		<div class="form-header">
			<h1>${formTitle}</h1>
			<p>
				${formDescription}
			</p>
		</div>

		<div class="inputs-wrapper">
			${form}
		</div>

		<button id="submit-btn" type="submit">
		<span>${spinnerIcon}</span>
		Submit form
		</button>
	</form>
	`;
};

export const createPage = (
	formTitle: string,
	formDescription: string,
	formSubmittedText: string | undefined,
	formFields: FormField[],
	testRun: boolean,
	instanceId?: string,
) => {
	const { formHtml, variables, validationCases } = prepareFormGroups(formFields);
	const form = createForm(formTitle, formDescription, formHtml);
	return `
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<link rel="icon" type="image/png" href="https://n8n.io/favicon.ico" />
			<link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'>
			<title>${formTitle}</title>
			<style>${styles}</style>
		</head>

		<body>
			<div class="modal"></div>
			<div class="container">
				<section>
					${testRun ? testNotice : ''}
					${form}
					${submittedTestMessage(formSubmittedText)}
					${automatedWith(instanceId)}
				</section>
			</div>
			<script>
			function validateInput(input, errorElement) {
				if (input.type === 'number' && input.value !== '') {
					const value = input.value.trim();

					if (value === '' || isNaN(value)) {
						errorElement.textContent = 'Enter only numbers in this field';
						errorElement.classList.add('error-show');
						return false;
					} else {
						errorElement.classList.remove('error-show');
						return true;
					}
				} else if (input.value === '') {
					errorElement.classList.add('error-show');
					return false;
				} else {
					errorElement.classList.remove('error-show');
					return true;
				}
			}

			function getSelectedValues(input) {
				const selectedValues = [];
				const checkboxes = input.querySelectorAll('.multiselect-checkbox');

				checkboxes.forEach((checkbox, index) => {
					if (checkbox.checked) {
						const label = input.querySelectorAll('label')[index];
						selectedValues.push(label.textContent.trim());
					}
				});

				return selectedValues;
			}

			function validateMultiselect(input, errorElement) {
				const selectedValues = getSelectedValues(input);

				if (!selectedValues.length) {
					errorElement.classList.add('error-show');
					return false;
				} else {
					errorElement.classList.remove('error-show');
					return true;
				}
			}

			const form = document.querySelector('#n8n-form');
			${variables}

			form.addEventListener('submit', (e) => {
				const valid = [];
				e.preventDefault();

				${validationCases}

				if (valid.every((v) => v)) {
					var formData = new FormData(form);

					document.querySelectorAll('.multiselect').forEach((multiselect) => {
						const selectedValues = getSelectedValues(multiselect);
						formData.append(multiselect.id, JSON.stringify(selectedValues));
					});

					formData.append("submittedAt", (new Date()).toISOString());

					document.querySelector('#submit-btn').disabled = true;
					document.querySelector('#submit-btn').style.cursor = 'not-allowed';
					document.querySelector('#submit-btn span').style.display = 'inline-block';
					fetch('#', {
						method: 'POST',
						body: formData
					})
					.then(async function (response) {
						const data = await response.json();
						data.status = response.status;
						return data;
					})
					.then(function (data) {
						if (data.status === 200) {
							form.style.display = 'none';
							document.querySelector('#submitted-form').style.display = 'block';
						} else {
							form.style.display = 'none';
							document.querySelector('#submitted-form').style.display = 'block';
							document.querySelector('#submitted-header').textContent = 'Problem submitting response';
							document.querySelector('#submitted-content').textContent = 'An error occurred in the workflow handling this form';
						}
					})
					.catch(function (error) {
						console.error('Error:', error);
					});
				}
			});
		</script>
		</body>
	</html>
	`;
};
