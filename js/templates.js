(function () {
    const STORAGE_KEY = 'SMART_BOARD_NOTICE_TEMPLATES';
    const CATEGORY_PRIORITY = ['Academic', 'Event', 'Emergency', 'Holiday', 'Motivation', 'General'];
    const SUPPORTED_LANGS = ['en', 'hi', 'mr'];

    const ICON_MAP = {
        Academic: 'academic',
        Event: 'event',
        Emergency: 'emergency',
        Holiday: 'holiday',
        Motivation: 'motivation',
        General: 'general'
    };

    const DEFAULT_TEMPLATES = [
        {
            templateId: 'tmpl-academic-001',
            name: 'Exam Schedule',
            category: 'Academic',
            description: 'Announce upcoming examination schedule details.',
            title: 'Examination Schedule Notice',
            content: 'Attention students: End semester examinations will begin from [DATE]. Please check your department timetable and reporting room details.',
            priority: 'normal',
            iconKey: 'academic'
        },
        {
            templateId: 'tmpl-academic-002',
            name: 'Results Declared',
            category: 'Academic',
            description: 'Notify students when results are published.',
            title: 'Result Declaration Notice',
            content: 'Results for [SUBJECT/SEMESTER] are now available. Students can check their marks on the official college portal.',
            priority: 'normal',
            iconKey: 'academic'
        },
        {
            templateId: 'tmpl-academic-003',
            name: 'Class Cancelled',
            category: 'Academic',
            description: 'Notify class cancellation for selected batches.',
            title: 'Class Cancellation Notice',
            content: 'Class for [SUBJECT] of [YEAR/DIVISION] scheduled at [TIME] has been cancelled. Students are requested to follow updated instructions.',
            priority: 'normal',
            iconKey: 'academic'
        },
        {
            templateId: 'tmpl-academic-004',
            name: 'Assignment Submission',
            category: 'Academic',
            description: 'Remind submission deadline for assignments.',
            title: 'Assignment Deadline Reminder',
            content: 'Final submission for [SUBJECT] assignment is on [DATE] before [TIME]. Submit on the official portal to avoid late penalties.',
            priority: 'normal',
            iconKey: 'academic'
        },
        {
            templateId: 'tmpl-event-001',
            name: 'Cultural Festival',
            category: 'Event',
            description: 'Announce annual cultural activities.',
            title: 'Annual Cultural Festival',
            content: 'The annual cultural festival begins on [DATE]. Join competitions, performances, and activity stalls across campus.',
            priority: 'normal',
            iconKey: 'event'
        },
        {
            templateId: 'tmpl-event-002',
            name: 'Workshop / Seminar',
            category: 'Event',
            description: 'Promote workshops and guest lectures.',
            title: 'Workshop Announcement',
            content: 'Workshop on [TOPIC] by [SPEAKER] on [DATE] at [VENUE]. All students of [DEPARTMENT] are encouraged to attend.',
            priority: 'normal',
            iconKey: 'event'
        },
        {
            templateId: 'tmpl-event-003',
            name: 'Sports Event',
            category: 'Event',
            description: 'Share sports meet and competition notices.',
            title: 'Sports Meet Announcement',
            content: 'Annual sports meet starts from [DATE]. Events include cricket, football, athletics, and indoor games. Register with sports office.',
            priority: 'normal',
            iconKey: 'event'
        },
        {
            templateId: 'tmpl-event-004',
            name: 'Placement Drive',
            category: 'Event',
            description: 'Publish placement and recruitment updates.',
            title: 'Campus Placement Drive',
            content: '[COMPANY_NAME] is visiting campus on [DATE] for [ROLE] positions. Eligible students must complete registration by [TIME].',
            priority: 'normal',
            iconKey: 'event'
        },
        {
            templateId: 'tmpl-emergency-001',
            name: 'Campus Security Alert',
            category: 'Emergency',
            description: 'Urgent campus safety communication.',
            title: 'Emergency Security Alert',
            content: 'Emergency alert: Please follow official instructions immediately and move to the designated safe assembly area.',
            priority: 'emergency',
            iconKey: 'emergency'
        },
        {
            templateId: 'tmpl-emergency-002',
            name: 'Fire Drill / Emergency',
            category: 'Emergency',
            description: 'Broadcast fire safety drill instructions.',
            title: 'Fire Drill Notice',
            content: 'A fire drill is in progress. Students and staff must use the nearest staircase and assemble at the designated safety zone.',
            priority: 'emergency',
            iconKey: 'emergency'
        },
        {
            templateId: 'tmpl-emergency-003',
            name: 'Weather Alert',
            category: 'Emergency',
            description: 'Issue severe weather warnings quickly.',
            title: 'Severe Weather Warning',
            content: 'Heavy rainfall and strong winds are expected on [DATE]. Avoid open areas, follow instructions, and stay inside designated safe buildings.',
            priority: 'emergency',
            iconKey: 'emergency'
        },
        {
            templateId: 'tmpl-holiday-001',
            name: 'Public Holiday',
            category: 'Holiday',
            description: 'Inform students and staff about holidays.',
            title: 'Holiday Notice',
            content: 'College will remain closed on [DATE] due to [FESTIVAL/OCCASION]. Regular classes will resume on [REOPEN_DATE].',
            priority: 'normal',
            iconKey: 'holiday'
        },
        {
            templateId: 'tmpl-holiday-002',
            name: 'Vacation Announcement',
            category: 'Holiday',
            description: 'Share semester vacation timeline.',
            title: 'Semester Vacation Notice',
            content: '[WINTER/SUMMER] break starts from [START_DATE] and ends on [END_DATE]. College operations resume on [REOPEN_DATE].',
            priority: 'normal',
            iconKey: 'holiday'
        },
        {
            templateId: 'tmpl-holiday-003',
            name: 'Festival Closure',
            category: 'Holiday',
            description: 'Closure notice for specific festival days.',
            title: 'Festival Closure Notice',
            content: 'Administrative office and library will remain closed on [DATE] for [FESTIVAL]. Essential services will continue as scheduled.',
            priority: 'normal',
            iconKey: 'holiday'
        },
        {
            templateId: 'tmpl-motivation-001',
            name: 'Thought of the Day',
            category: 'Motivation',
            description: 'Display a short motivational thought.',
            title: 'Thought of the Day',
            content: 'Success is built through small consistent efforts. Stay focused, stay disciplined, and keep moving forward.',
            priority: 'normal',
            iconKey: 'motivation'
        },
        {
            templateId: 'tmpl-motivation-002',
            name: 'Attendance Motivation',
            category: 'Motivation',
            description: 'Encourage students to maintain attendance.',
            title: 'Attendance Motivation',
            content: 'Regular attendance builds confidence and success. Attend all classes and stay updated with every lecture.',
            priority: 'normal',
            iconKey: 'motivation'
        },
        {
            templateId: 'tmpl-motivation-003',
            name: 'Achievement Reminder',
            category: 'Motivation',
            description: 'Promote goal-focused student mindset.',
            title: 'Achievement Reminder',
            content: 'Your future is shaped by daily effort. Learn continuously, use your time wisely, and keep your goals clear.',
            priority: 'normal',
            iconKey: 'motivation'
        },
        {
            templateId: 'tmpl-general-001',
            name: 'Fee Payment Reminder',
            category: 'General',
            description: 'Remind fee deadlines and portal details.',
            title: 'Fee Payment Reminder',
            content: 'Last date for fee payment for [SEMESTER/YEAR] is [DATE]. Use [PORTAL_URL] or visit the accounts office.',
            priority: 'normal',
            iconKey: 'general'
        },
        {
            templateId: 'tmpl-general-002',
            name: 'Library Notice',
            category: 'General',
            description: 'Share library timing and policy updates.',
            title: 'Library Notice',
            content: 'Library timings are 8:00 AM to 8:00 PM. Please return due books by [DATE] to avoid fines and account restrictions.',
            priority: 'normal',
            iconKey: 'general'
        }
    ];

    // Static/manual translations for default templates (no auto-translate).
    // Used as a fallback whenever a stored template is missing language fields.
    const DEFAULT_TEMPLATE_TRANSLATIONS = {
        'tmpl-academic-001': {
            hi: {
                name: 'परीक्षा समय-सारणी',
                description: 'आगामी परीक्षा समय-सारणी की जानकारी दें।',
                title: 'परीक्षा समय-सारणी सूचना',
                content: 'ध्यान दें विद्यार्थियों: सेमेस्टर अंत की परीक्षाएं [DATE] से शुरू होंगी। कृपया अपने विभाग का समय-सारणी और रिपोर्टिंग कक्ष विवरण देखें।'
            },
            mr: {
                name: 'परीक्षा वेळापत्रक',
                description: 'आगामी परीक्षा वेळापत्रकाची माहिती द्या.',
                title: 'परीक्षा वेळापत्रक सूचना',
                content: 'विद्यार्थ्यांचे लक्षात घ्या: सत्रअंत परीक्षा [DATE] पासून सुरू होणार आहेत. कृपया आपल्या विभागाचे वेळापत्रक आणि रिपोर्टिंग रूमचे तपशील पाहा.'
            }
        },
        'tmpl-academic-002': {
            hi: {
                name: 'परिणाम घोषित',
                description: 'परिणाम प्रकाशित होने पर विद्यार्थियों को सूचित करें।',
                title: 'परिणाम घोषणा सूचना',
                content: '[SUBJECT/SEMESTER] के परिणाम अब उपलब्ध हैं। विद्यार्थी आधिकारिक कॉलेज पोर्टल पर अपने अंक देख सकते हैं।'
            },
            mr: {
                name: 'निकाल जाहीर',
                description: 'निकाल प्रकाशित झाल्यावर विद्यार्थ्यांना सूचित करा.',
                title: 'निकाल घोषणा सूचना',
                content: '[SUBJECT/SEMESTER] चे निकाल आता उपलब्ध आहेत. विद्यार्थी अधिकृत कॉलेज पोर्टलवर आपले गुण तपासू शकतात.'
            }
        },
        'tmpl-academic-003': {
            hi: {
                name: 'कक्षा रद्द',
                description: 'चयनित बैचों के लिए कक्षा रद्द होने की सूचना दें।',
                title: 'कक्षा रद्द होने की सूचना',
                content: '[YEAR/DIVISION] के [SUBJECT] की [TIME] पर निर्धारित कक्षा रद्द कर दी गई है। विद्यार्थियों से अनुरोध है कि अद्यतन निर्देशों का पालन करें।'
            },
            mr: {
                name: 'वर्ग रद्द',
                description: 'निवडलेल्या बॅचसाठी वर्ग रद्द झाल्याची सूचना द्या.',
                title: 'वर्ग रद्द सूचना',
                content: '[YEAR/DIVISION] चा [SUBJECT] चा [TIME] वाजता नियोजित वर्ग रद्द करण्यात आला आहे. विद्यार्थ्यांना विनंती आहे की अद्ययावत सूचनांचे पालन करावे.'
            }
        },
        'tmpl-academic-004': {
            hi: {
                name: 'असाइनमेंट जमा',
                description: 'असाइनमेंट जमा करने की अंतिम तिथि याद दिलाएं।',
                title: 'असाइनमेंट अंतिम तिथि स्मरण',
                content: '[SUBJECT] असाइनमेंट का अंतिम सबमिशन [DATE] को [TIME] से पहले है। लेट पेनल्टी से बचने के लिए आधिकारिक पोर्टल पर जमा करें।'
            },
            mr: {
                name: 'असाइनमेंट सबमिशन',
                description: 'असाइनमेंट सबमिशनची अंतिम तारीख आठवण करून द्या.',
                title: 'असाइनमेंट अंतिम तारीख आठवण',
                content: '[SUBJECT] असाइनमेंटचे अंतिम सबमिशन [DATE] रोजी [TIME] पूर्वी आहे. उशीर दंड टाळण्यासाठी अधिकृत पोर्टलवर सबमिट करा.'
            }
        },
        'tmpl-event-001': {
            hi: {
                name: 'सांस्कृतिक महोत्सव',
                description: 'वार्षिक सांस्कृतिक कार्यक्रमों की घोषणा करें।',
                title: 'वार्षिक सांस्कृतिक महोत्सव',
                content: 'वार्षिक सांस्कृतिक महोत्सव [DATE] से शुरू होगा। प्रतियोगिताओं, प्रस्तुतियों और गतिविधि स्टॉल्स में भाग लें।'
            },
            mr: {
                name: 'सांस्कृतिक महोत्सव',
                description: 'वार्षिक सांस्कृतिक कार्यक्रमांची घोषणा करा.',
                title: 'वार्षिक सांस्कृतिक महोत्सव',
                content: 'वार्षिक सांस्कृतिक महोत्सव [DATE] पासून सुरू होईल. स्पर्धा, सादरीकरणे आणि उपक्रम स्टॉल्समध्ये सहभागी व्हा.'
            }
        },
        'tmpl-event-002': {
            hi: {
                name: 'कार्यशाला / सेमिनार',
                description: 'कार्यशालाओं और अतिथि व्याख्यानों की जानकारी दें।',
                title: 'कार्यशाला सूचना',
                content: '[TOPIC] पर [SPEAKER] द्वारा कार्यशाला [DATE] को [VENUE] में। [DEPARTMENT] के सभी विद्यार्थियों से उपस्थित रहने का अनुरोध है।'
            },
            mr: {
                name: 'कार्यशाळा / सेमिनार',
                description: 'कार्यशाळा आणि अतिथी व्याख्यानांची माहिती द्या.',
                title: 'कार्यशाळा सूचना',
                content: '[TOPIC] वर [SPEAKER] यांची कार्यशाळा [DATE] रोजी [VENUE] येथे आयोजित आहे. [DEPARTMENT] मधील सर्व विद्यार्थ्यांनी उपस्थित राहावे.'
            }
        },
        'tmpl-event-003': {
            hi: {
                name: 'क्रीडा स्पर्धा',
                description: 'स्पोर्ट्स मीट और प्रतियोगिता सूचनाएं साझा करें।',
                title: 'स्पोर्ट्स मीट सूचना',
                content: 'वार्षिक स्पोर्ट्स मीट [DATE] से शुरू होगी। क्रिकेट, फुटबॉल, एथलेटिक्स और इंडोर गेम्स शामिल हैं। स्पोर्ट्स ऑफिस में पंजीकरण करें।'
            },
            mr: {
                name: 'क्रीडा स्पर्धा',
                description: 'स्पोर्ट्स मीट आणि स्पर्धांच्या सूचना द्या.',
                title: 'क्रीडा स्पर्धा सूचना',
                content: 'वार्षिक स्पोर्ट्स मीट [DATE] पासून सुरू होईल. क्रिकेट, फुटबॉल, अ‍ॅथलेटिक्स आणि इनडोअर खेळांचा समावेश आहे. स्पोर्ट्स ऑफिसमध्ये नोंदणी करा.'
            }
        },
        'tmpl-event-004': {
            hi: {
                name: 'प्लेसमेंट ड्राइव',
                description: 'प्लेसमेंट और भर्ती अपडेट साझा करें।',
                title: 'कैंपस प्लेसमेंट ड्राइव',
                content: '[COMPANY_NAME] [DATE] को [ROLE] पदों के लिए कैंपस में आएगी। पात्र विद्यार्थियों को [TIME] तक पंजीकरण पूरा करना होगा।'
            },
            mr: {
                name: 'प्लेसमेंट ड्राईव्ह',
                description: 'प्लेसमेंट आणि भरती अपडेट्स द्या.',
                title: 'कॅम्पस प्लेसमेंट ड्राईव्ह',
                content: '[COMPANY_NAME] [DATE] रोजी [ROLE] पदांसाठी कॅम्पसला भेट देणार आहे. पात्र विद्यार्थ्यांनी [TIME] पर्यंत नोंदणी पूर्ण करावी.'
            }
        },
        'tmpl-emergency-001': {
            hi: {
                name: 'कैंपस सुरक्षा अलर्ट',
                description: 'तत्काल कैंपस सुरक्षा सूचना।',
                title: 'आपातकालीन सुरक्षा अलर्ट',
                content: 'आपातकालीन अलर्ट: कृपया तुरंत आधिकारिक निर्देशों का पालन करें और निर्धारित सुरक्षित एकत्रीकरण क्षेत्र में जाएं।'
            },
            mr: {
                name: 'कॅम्पस सुरक्षा इशारा',
                description: 'तत्काळ कॅम्पस सुरक्षा सूचना.',
                title: 'आपत्कालीन सुरक्षा इशारा',
                content: 'आपत्कालीन इशारा: कृपया तत्काळ अधिकृत सूचनांचे पालन करा आणि निर्धारित सुरक्षित एकत्रीकरण क्षेत्रात जा.'
            }
        },
        'tmpl-emergency-002': {
            hi: {
                name: 'अग्निशमन ड्रिल / आपातकाल',
                description: 'फायर सेफ्टी ड्रिल के निर्देश प्रसारित करें।',
                title: 'फायर ड्रिल सूचना',
                content: 'फायर ड्रिल चल रही है। छात्र और कर्मचारी नज़दीकी सीढ़ियों का उपयोग करें और निर्धारित सुरक्षा क्षेत्र में एकत्र हों।'
            },
            mr: {
                name: 'अग्निसुरक्षा ड्रिल / आपत्काल',
                description: 'अग्निसुरक्षा ड्रिलच्या सूचना प्रसारित करा.',
                title: 'अग्निसुरक्षा ड्रिल सूचना',
                content: 'अग्निसुरक्षा ड्रिल सुरू आहे. विद्यार्थी आणि कर्मचारी जवळच्या जिन्याचा वापर करून निर्धारित सुरक्षा क्षेत्रात एकत्र यावेत.'
            }
        },
        'tmpl-emergency-003': {
            hi: {
                name: 'मौसम अलर्ट',
                description: 'गंभीर मौसम चेतावनी जारी करें।',
                title: 'गंभीर मौसम चेतावनी',
                content: '[DATE] को भारी बारिश और तेज़ हवाओं की संभावना है। खुले क्षेत्रों से बचें, निर्देशों का पालन करें और सुरक्षित भवनों के भीतर रहें।'
            },
            mr: {
                name: 'हवामान इशारा',
                description: 'तीव्र हवामान इशारे द्या.',
                title: 'तीव्र हवामान चेतावणी',
                content: '[DATE] रोजी जोरदार पाऊस आणि वेगवान वारे अपेक्षित आहेत. मोकळ्या जागा टाळा, सूचनांचे पालन करा आणि सुरक्षित इमारतीत रहा.'
            }
        },
        'tmpl-holiday-001': {
            hi: {
                name: 'सार्वजनिक अवकाश',
                description: 'छुट्टियों के बारे में छात्रों और कर्मचारियों को सूचित करें।',
                title: 'सुट्टी सूचना',
                content: '[FESTIVAL/OCCASION] के कारण कॉलेज [DATE] को बंद रहेगा। नियमित कक्षाएं [REOPEN_DATE] से शुरू होंगी।'
            },
            mr: {
                name: 'सार्वजनिक सुट्टी',
                description: 'सुट्ट्यांविषयी विद्यार्थी आणि कर्मचाऱ्यांना कळवा.',
                title: 'सुट्टी सूचना',
                content: '[FESTIVAL/OCCASION] मुळे कॉलेज [DATE] रोजी बंद राहील. नियमित वर्ग [REOPEN_DATE] पासून सुरू होतील.'
            }
        },
        'tmpl-holiday-002': {
            hi: {
                name: 'अवकाश घोषणा',
                description: 'सेमेस्टर अवकाश की अवधि बताएं।',
                title: 'सेमेस्टर अवकाश सूचना',
                content: '[WINTER/SUMMER] अवकाश [START_DATE] से शुरू होकर [END_DATE] को समाप्त होगा। कॉलेज कार्य [REOPEN_DATE] से पुनः शुरू होंगे।'
            },
            mr: {
                name: 'सुट्टी घोषणा',
                description: 'सेमेस्टर सुट्टीची कालावधी माहिती द्या.',
                title: 'सेमेस्टर सुट्टी सूचना',
                content: '[WINTER/SUMMER] सुट्टी [START_DATE] पासून सुरू होऊन [END_DATE] रोजी संपेल. कॉलेजचे कार्य [REOPEN_DATE] पासून पुन्हा सुरू होईल.'
            }
        },
        'tmpl-holiday-003': {
            hi: {
                name: 'त्योहार बंद',
                description: 'विशेष त्योहार दिवसों के लिए बंद रहने की सूचना।',
                title: 'त्योहार बंद सूचना',
                content: '[FESTIVAL] के कारण प्रशासनिक कार्यालय और पुस्तकालय [DATE] को बंद रहेंगे। आवश्यक सेवाएं निर्धारित अनुसार जारी रहेंगी।'
            },
            mr: {
                name: 'सणानिमित्त बंद',
                description: 'विशिष्ट सणाच्या दिवशी बंद राहण्याची सूचना.',
                title: 'सणानिमित्त बंद सूचना',
                content: '[FESTIVAL] निमित्त प्रशासन कार्यालय आणि ग्रंथालय [DATE] रोजी बंद राहील. अत्यावश्यक सेवा नियोजित वेळापत्रकानुसार सुरू राहतील.'
            }
        },
        'tmpl-motivation-001': {
            hi: {
                name: 'दिन का विचार',
                description: 'एक छोटा प्रेरणादायक विचार प्रदर्शित करें।',
                title: 'दिन का विचार',
                content: 'सफलता छोटे-छोटे निरंतर प्रयासों से बनती है। केंद्रित रहें, अनुशासित रहें और आगे बढ़ते रहें।'
            },
            mr: {
                name: 'आजचा विचार',
                description: 'लहान प्रेरणादायी विचार दाखवा.',
                title: 'आजचा विचार',
                content: 'यश छोटे पण सातत्यपूर्ण प्रयत्नांनी घडते. लक्ष केंद्रित ठेवा, शिस्त पाळा आणि पुढे जात राहा.'
            }
        },
        'tmpl-motivation-002': {
            hi: {
                name: 'उपस्थिति के लिए प्रेरणा',
                description: 'विद्यार्थियों को नियमित उपस्थिति के लिए प्रोत्साहित करें।',
                title: 'उपस्थिति के लिए प्रेरणा',
                content: 'नियमित उपस्थिति आत्मविश्वास और सफलता बढ़ाती है। सभी कक्षाओं में उपस्थित रहें और प्रत्येक व्याख्यान से अपडेट रहें।'
            },
            mr: {
                name: 'उपस्थितीसाठी प्रेरणा',
                description: 'विद्यार्थ्यांना नियमित उपस्थितीसाठी प्रोत्साहित करा.',
                title: 'उपस्थितीसाठी प्रेरणा',
                content: 'नियमित उपस्थिती आत्मविश्वास आणि यश वाढवते. सर्व वर्गांना उपस्थित रहा आणि प्रत्येक व्याख्यानाशी अपडेट रहा.'
            }
        },
        'tmpl-motivation-003': {
            hi: {
                name: 'उपलब्धि स्मरण',
                description: 'लक्ष्य-केंद्रित विद्यार्थी मानसिकता को बढ़ावा दें।',
                title: 'उपलब्धि स्मरण',
                content: 'आपका भविष्य दैनिक प्रयास से बनता है। लगातार सीखें, समय का सही उपयोग करें, और अपने लक्ष्य स्पष्ट रखें।'
            },
            mr: {
                name: 'यशाची आठवण',
                description: 'ध्येयकेंद्रित विचारांना प्रोत्साहन द्या.',
                title: 'यशाची आठवण',
                content: 'तुमचे भविष्य रोजच्या प्रयत्नांनी घडते. सातत्याने शिका, वेळेचा योग्य वापर करा आणि तुमची उद्दिष्टे स्पष्ट ठेवा.'
            }
        },
        'tmpl-general-001': {
            hi: {
                name: 'फीस भुगतान स्मरण',
                description: 'फीस की अंतिम तिथि और पोर्टल विवरण की याद दिलाएं।',
                title: 'फीस भुगतान स्मरण',
                content: '[SEMESTER/YEAR] की फीस भुगतान की अंतिम तिथि [DATE] है। [PORTAL_URL] का उपयोग करें या लेखा कार्यालय में संपर्क करें।'
            },
            mr: {
                name: 'फी भरणा आठवण',
                description: 'फीची अंतिम तारीख आणि पोर्टलची माहिती आठवण करून द्या.',
                title: 'फी भरणा आठवण',
                content: '[SEMESTER/YEAR] साठी फी भरण्याची अंतिम तारीख [DATE] आहे. [PORTAL_URL] वापरा किंवा अकाउंट्स ऑफिसला भेट द्या.'
            }
        },
        'tmpl-general-002': {
            hi: {
                name: 'पुस्तकालय सूचना',
                description: 'पुस्तकालय समय और नियम अपडेट साझा करें।',
                title: 'पुस्तकालय सूचना',
                content: 'पुस्तकालय का समय सुबह 8:00 बजे से शाम 8:00 बजे तक है। कृपया [DATE] तक देय पुस्तकें लौटाएं ताकि जुर्माना और प्रतिबंध से बचा जा सके।'
            },
            mr: {
                name: 'ग्रंथालय सूचना',
                description: 'ग्रंथालय वेळा आणि नियम अपडेट्स द्या.',
                title: 'ग्रंथालय सूचना',
                content: 'ग्रंथालय वेळ सकाळी 8:00 ते संध्याकाळी 8:00 आहे. कृपया दंड आणि निर्बंध टाळण्यासाठी [DATE] पूर्वी देय पुस्तके परत करा.'
            }
        }
    };

    function createTemplateId() {
        return `tmpl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    function toPriority(value) {
        return String(value || 'normal').toLowerCase() === 'emergency' ? 'emergency' : 'normal';
    }

    function toCategory(value) {
        const normalized = String(value || '').trim();
        if (CATEGORY_PRIORITY.includes(normalized)) return normalized;
        return 'General';
    }

    function toIconKey(value, category) {
        const normalized = String(value || '').trim().toLowerCase();
        if (['academic', 'event', 'emergency', 'holiday', 'motivation', 'general'].includes(normalized)) {
            return normalized;
        }
        return ICON_MAP[toCategory(category)] || 'general';
    }

    function normalizeTranslationFields(value) {
        const source = value && typeof value === 'object' ? value : {};
        return {
            name: String(source.name || '').trim(),
            description: String(source.description || '').trim(),
            title: String(source.title || '').trim(),
            content: String(source.content || '').trim()
        };
    }

    function mergeTranslation(base, override) {
        const b = normalizeTranslationFields(base);
        const o = normalizeTranslationFields(override);
        return {
            name: o.name || b.name || '',
            description: o.description || b.description || '',
            title: o.title || b.title || '',
            content: o.content || b.content || ''
        };
    }

    function normalizeTranslations(templateId, rawTranslations, enFallback) {
        const incoming = rawTranslations && typeof rawTranslations === 'object' ? rawTranslations : {};
        const en = mergeTranslation(enFallback, incoming.en);
        const hi = normalizeTranslationFields(incoming.hi);
        const mr = normalizeTranslationFields(incoming.mr);

        const defaults = DEFAULT_TEMPLATE_TRANSLATIONS[String(templateId || '')] || null;
        const nextHi = defaults ? mergeTranslation(defaults.hi, hi) : hi;
        const nextMr = defaults ? mergeTranslation(defaults.mr, mr) : mr;

        return { en, hi: nextHi, mr: nextMr };
    }

    function normalizeTemplate(template) {
        const templateId = String(template.templateId || createTemplateId());
        const category = toCategory(template.category);
        const title = String(template.title || '').trim() || 'Notice';
        const name = String(template.name || title || 'Notice Template').trim() || 'Notice Template';
        const description = String(template.description || '').trim();
        const content = String(template.content || '').trim();
        const enFallback = { name, description, title, content };

        const translations = normalizeTranslations(templateId, template.translations || template.i18n, enFallback);
        const enResolved = translations.en || enFallback;

        return {
            templateId,
            // Keep top-level fields in English for backward compatibility.
            name: String(enResolved.name || name || 'Notice Template').trim() || 'Notice Template',
            category,
            description: String(enResolved.description || description || '').trim(),
            title: String(enResolved.title || title || 'Notice').trim() || 'Notice',
            content: String(enResolved.content || content || '').trim(),
            priority: toPriority(template.priority),
            iconKey: toIconKey(template.iconKey || template.icon, category),
            translations
        };
    }

    function getDefaultTemplates() {
        return DEFAULT_TEMPLATES.map((template) => normalizeTemplate(template));
    }

    function mergeWithDefaults(storedTemplates) {
        const merged = [];
        const seen = new Set();

        (storedTemplates || []).map((item) => normalizeTemplate(item)).forEach((template) => {
            if (seen.has(template.templateId)) return;
            seen.add(template.templateId);
            merged.push(template);
        });

        getDefaultTemplates().forEach((template) => {
            if (seen.has(template.templateId)) return;
            seen.add(template.templateId);
            merged.push(template);
        });

        return merged;
    }

    function ensureTemplates() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            const stored = Array.isArray(parsed) ? parsed : [];
            const merged = mergeWithDefaults(stored);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
        } catch (error) {
            const defaults = getDefaultTemplates();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
            return defaults;
        }
    }

    function getTemplates() {
        return ensureTemplates();
    }

    function saveTemplates(templates) {
        const normalized = (templates || []).map((template) => normalizeTemplate(template));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
    }

    function getTemplateById(templateId) {
        return getTemplates().find((item) => item.templateId === templateId) || null;
    }

    function upsertTemplate(inputTemplate) {
        const nextTemplate = normalizeTemplate(inputTemplate || {});
        const templates = getTemplates();
        const index = templates.findIndex((item) => item.templateId === nextTemplate.templateId);
        if (index >= 0) {
            templates[index] = nextTemplate;
        } else {
            templates.unshift(nextTemplate);
        }
        saveTemplates(templates);
        return nextTemplate;
    }

    function deleteTemplate(templateId) {
        const templates = getTemplates();
        const filtered = templates.filter((item) => item.templateId !== templateId);
        saveTemplates(filtered);
        return filtered.length !== templates.length;
    }

    function getCategories() {
        const templates = getTemplates();
        const dynamic = Array.from(new Set(templates.map((item) => item.category).filter(Boolean)));
        const ordered = CATEGORY_PRIORITY.filter((category) => dynamic.includes(category));
        dynamic.forEach((category) => {
            if (!ordered.includes(category)) ordered.push(category);
        });
        return ordered;
    }

    function getIconSvg(iconKey) {
        const key = toIconKey(iconKey, 'General');
        const icons = {
            academic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7l8-4 8 4-8 4-8-4z"/><path d="M6 10v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M20 8v6"/></svg>',
            event: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M8 14h3M13 14h3M8 18h8"/></svg>',
            emergency: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3l9 16H3L12 3z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>',
            holiday: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 21h16"/><path d="M7 21V9l5-3 5 3v12"/><path d="M9.5 14h5"/></svg>',
            motivation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l3 6 6 .9-4.5 4.4 1.1 6.2L12 17.8 6.4 20.5l1.1-6.2L3 9.9 9 9l3-6z"/></svg>',
            general: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>'
        };
        return icons[key] || icons.general;
    }

    window.noticeTemplateStore = {
        STORAGE_KEY,
        getTemplates,
        getTemplateById,
        upsertTemplate,
        deleteTemplate,
        getCategories,
        getIconSvg
    };
})();
