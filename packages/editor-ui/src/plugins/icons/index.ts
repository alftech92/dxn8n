import type { Plugin } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import type { IconDefinition, Library } from '@fortawesome/fontawesome-svg-core';
import {
	faAngleDoubleLeft,
	faAngleDown,
	faAngleLeft,
	faAngleRight,
	faAngleUp,
	faArchive,
	faArrowLeft,
	faArrowRight,
	faArrowUp,
	faArrowDown,
	faAt,
	faBan,
	faBalanceScaleLeft,
	faBars,
	faBolt,
	faBook,
	faBoxOpen,
	faBug,
	faBrain,
	faCalculator,
	faCalendar,
	faCaretDown,
	faCaretUp,
	faChartBar,
	faCheck,
	faCheckCircle,
	faCheckSquare,
	faChevronDown,
	faChevronUp,
	faChevronLeft,
	faChevronRight,
	faCode,
	faCodeBranch,
	faCog,
	faCogs,
	faComment,
	faComments,
	faClipboardList,
	faClock,
	faClone,
	faCloud,
	faCloudDownloadAlt,
	faCopy,
	faCube,
	faCut,
	faDatabase,
	faDotCircle,
	faEdit,
	faEllipsisH,
	faEllipsisV,
	faEnvelope,
	faEquals,
	faEye,
	faEyeSlash,
	faExclamationTriangle,
	faExpand,
	faExpandAlt,
	faExternalLinkAlt,
	faExchangeAlt,
	faFile,
	faFileAlt,
	faFileArchive,
	faFileCode,
	faFileDownload,
	faFileExport,
	faFileImport,
	faFilePdf,
	faFilter,
	faFingerprint,
	faFlask,
	faFolderOpen,
	faFont,
	faGlobeAmericas,
	faGift,
	faGlobe,
	faGraduationCap,
	faGripLinesVertical,
	faGripVertical,
	faHandHoldingUsd,
	faHandScissors,
	faHandPointLeft,
	faHandshake,
	faUserCheck,
	faHashtag,
	faHdd,
	faHistory,
	faHome,
	faHourglass,
	faImage,
	faInbox,
	faInfo,
	faInfoCircle,
	faKey,
	faLanguage,
	faLayerGroup,
	faLink,
	faList,
	faLightbulb,
	faLock,
	faMapSigns,
	faMousePointer,
	faNetworkWired,
	faPalette,
	faPause,
	faPauseCircle,
	faPen,
	faPencilAlt,
	faPlay,
	faPlayCircle,
	faPlug,
	faPlus,
	faPlusCircle,
	faPlusSquare,
	faQuestion,
	faQuestionCircle,
	faRedo,
	faRobot,
	faRss,
	faSave,
	faSatelliteDish,
	faSearch,
	faSearchMinus,
	faSearchPlus,
	faServer,
	faScrewdriver,
	faSmile,
	faSignInAlt,
	faSignOutAlt,
	faSlidersH,
	faSpinner,
	faStop,
	faSun,
	faSync,
	faSyncAlt,
	faTable,
	faTags,
	faTasks,
	faTerminal,
	faThLarge,
	faThumbtack,
	faThumbsDown,
	faThumbsUp,
	faTimes,
	faTimesCircle,
	faToolbox,
	faTrash,
	faUndo,
	faUnlink,
	faUser,
	faUserCircle,
	faUserFriends,
	faUsers,
	faVectorSquare,
	faVideo,
	faTree,
	faStickyNote as faSolidStickyNote,
	faUserLock,
	faGem,
	faDownload,
	faRemoveFormat,
	faTools,
	faProjectDiagram,
	faStream,
	faPowerOff,
	faPaperPlane,
	faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import { faVariable, faXmark, faVault, faRefresh } from './custom';
import { faStickyNote } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

function addIcon(icon: IconDefinition) {
	library.add(icon);
}

export const FontAwesomePlugin: Plugin = {
	install: (app) => {
		addIcon(faAngleDoubleLeft);
		addIcon(faAngleDown);
		addIcon(faAngleLeft);
		addIcon(faAngleRight);
		addIcon(faAngleUp);
		addIcon(faArchive);
		addIcon(faArrowLeft);
		addIcon(faArrowRight);
		addIcon(faArrowUp);
		addIcon(faArrowDown);
		addIcon(faAt);
		addIcon(faBan);
		addIcon(faBalanceScaleLeft);
		addIcon(faBars);
		addIcon(faBolt);
		addIcon(faBook);
		addIcon(faBoxOpen);
		addIcon(faBug);
		addIcon(faBrain);
		addIcon(faCalculator);
		addIcon(faCalendar);
		addIcon(faCaretDown);
		addIcon(faCaretUp);
		addIcon(faChartBar);
		addIcon(faCheck);
		addIcon(faCheckCircle);
		addIcon(faCheckSquare);
		addIcon(faChevronLeft);
		addIcon(faChevronRight);
		addIcon(faChevronDown);
		addIcon(faChevronUp);
		addIcon(faCode);
		addIcon(faCodeBranch);
		addIcon(faCog);
		addIcon(faCogs);
		addIcon(faComment);
		addIcon(faComments);
		addIcon(faClipboardList);
		addIcon(faClock);
		addIcon(faClone);
		addIcon(faCloud);
		addIcon(faCloudDownloadAlt);
		addIcon(faCopy);
		addIcon(faCube);
		addIcon(faCut);
		addIcon(faDatabase);
		addIcon(faDotCircle);
		addIcon(faGripLinesVertical);
		addIcon(faGripVertical);
		addIcon(faEdit);
		addIcon(faEllipsisH);
		addIcon(faEllipsisV);
		addIcon(faEnvelope);
		addIcon(faEquals);
		addIcon(faEye);
		addIcon(faEyeSlash);
		addIcon(faExclamationTriangle);
		addIcon(faExclamationCircle);
		addIcon(faExpand);
		addIcon(faExpandAlt);
		addIcon(faExternalLinkAlt);
		addIcon(faExchangeAlt);
		addIcon(faFile);
		addIcon(faFileAlt);
		addIcon(faFileArchive);
		addIcon(faFileCode);
		addIcon(faFileDownload);
		addIcon(faFileExport);
		addIcon(faFileImport);
		addIcon(faFilePdf);
		addIcon(faFilter);
		addIcon(faFingerprint);
		addIcon(faFlask);
		addIcon(faFolderOpen);
		addIcon(faFont);
		addIcon(faGift);
		addIcon(faGlobe);
		addIcon(faGlobeAmericas);
		addIcon(faGraduationCap);
		addIcon(faHandHoldingUsd);
		addIcon(faHandScissors);
		addIcon(faHandshake);
		addIcon(faHandPointLeft);
		addIcon(faHashtag);
		addIcon(faUserCheck);
		addIcon(faHdd);
		addIcon(faHistory);
		addIcon(faHome);
		addIcon(faHourglass);
		addIcon(faImage);
		addIcon(faInbox);
		addIcon(faInfo);
		addIcon(faInfoCircle);
		addIcon(faKey);
		addIcon(faLanguage);
		addIcon(faLayerGroup);
		addIcon(faLink);
		addIcon(faList);
		addIcon(faLightbulb);
		addIcon(faLock);
		addIcon(faMapSigns);
		addIcon(faMousePointer);
		addIcon(faNetworkWired);
		addIcon(faPalette);
		addIcon(faPause);
		addIcon(faPauseCircle);
		addIcon(faPen);
		addIcon(faPencilAlt);
		addIcon(faPlay);
		addIcon(faPlayCircle);
		addIcon(faPlug);
		addIcon(faPlus);
		addIcon(faPlusCircle);
		addIcon(faPlusSquare);
		addIcon(faProjectDiagram);
		addIcon(faQuestion);
		addIcon(faQuestionCircle);
		addIcon(faRedo);
		addIcon(faRemoveFormat);
		addIcon(faRobot);
		addIcon(faRss);
		addIcon(faSave);
		addIcon(faSatelliteDish);
		addIcon(faSearch);
		addIcon(faSearchMinus);
		addIcon(faSearchPlus);
		addIcon(faServer);
		addIcon(faScrewdriver);
		addIcon(faSmile);
		addIcon(faSignInAlt);
		addIcon(faSignOutAlt);
		addIcon(faSlidersH);
		addIcon(faSpinner);
		addIcon(faSolidStickyNote);
		addIcon(faStickyNote as IconDefinition);
		addIcon(faStop);
		addIcon(faStream);
		addIcon(faSun);
		addIcon(faSync);
		addIcon(faSyncAlt);
		addIcon(faTable);
		addIcon(faTags);
		addIcon(faTasks);
		addIcon(faTerminal);
		addIcon(faThLarge);
		addIcon(faThumbtack);
		addIcon(faThumbsDown);
		addIcon(faThumbsUp);
		addIcon(faTimes);
		addIcon(faTimesCircle);
		addIcon(faToolbox);
		addIcon(faTools);
		addIcon(faTrash);
		addIcon(faUndo);
		addIcon(faUnlink);
		addIcon(faUser);
		addIcon(faUserCircle);
		addIcon(faUserFriends);
		addIcon(faUsers);
		addIcon(faVariable);
		addIcon(faVault);
		addIcon(faVectorSquare);
		addIcon(faVideo);
		addIcon(faTree);
		addIcon(faUserLock);
		addIcon(faGem);
		addIcon(faXmark);
		addIcon(faDownload);
		addIcon(faPowerOff);
		addIcon(faPaperPlane);
		addIcon(faRefresh);

		app.component('FontAwesomeIcon', FontAwesomeIcon);
	},
};

type LibraryWithDefinitions = Library & {
	definitions: Record<string, Record<string, IconDefinition>>;
};

export const iconLibrary = library as LibraryWithDefinitions;

export const getAllIconNames = () => {
	return Object.keys(iconLibrary.definitions.fas);
};
