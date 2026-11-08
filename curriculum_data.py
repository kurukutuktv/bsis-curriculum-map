# Transcribed from CMO No. 25, s. 2015 -- Curriculum Map for BSIS (pp. 25-28) and BSIS Graduate Outcomes (pp. 7-8).
import json

def row(*pairs):
    """row({1:'E',2:'E'}) -> list of 10 codes ('' if none). Keys are IS column numbers 1..10."""
    r = [''] * 10
    for k, v in pairs[0].items():
        r[k - 1] = v
    return r

def seq(letter, cols):
    return row({c: letter for c in cols})

PILO = [
 ("IS01", "Knowledge for Solving Computing Problems", "Apply knowledge of business processes, computing, mathematics and social sciences appropriate to Information Systems"),
 ("IS02", "Problem Analysis", "Analyze a problem, identify and define the computing requirements with respect to organizational factors appropriate to its solution and plan strategies for their solution"),
 ("IS03", "Problem Analysis", "Evaluate information systems in terms of general quality attributes and possible trade-offs presented within the given requirement"),
 ("IS04", "Design/Development of Solutions", "Design, implement, and evaluate information systems, processes, components, or programs and to source cost-benefit efficient alternatives to meet desired needs, goals and constraints"),
 ("IS05", "Design/Development of Solutions", "Use knowledge and understanding of enterprises in modelling and design of information systems"),
 ("IS06", "Modern Tool Usage", "Deploy and use effectively skills, tools and techniques necessary for information systems practice"),
 ("IS07", "Individual and Team Work", "Function effectively on teams (recognizing the different roles within a team and different ways of organizing teams) to accomplish a common goal"),
 ("IS08", "Communication", "Communicate effectively with a range of audiences. Communication skills includes techincal writing, presentation and neogitation, and numeracy."),
 ("IS09", "Computing Professionalism and Ethics in the Society", "Recognize the legal, social, ethical and professional issues involved in the exploitation of computer technology and be guided by the adoption of appropriate professional, ethical and legal practices both in the local and global community"),
 ("IS10", "Life-Long Learning", "Recognize the need for and engage in an independent and life-long learning, planning self-learning and improving performance as the foundation for on-going professional development"),
]

# mode "course": one set of codes printed for the whole course (merged cell or single LO)
# mode "lo":     one set of codes per learning outcome row
def C(code, title, pre, los, codes, page, units=3):
    return dict(code=code, title=title, pre=pre, units=units, los=los, mode="course", codes=codes, page=page)

def L(code, title, pre, los, codes_per_lo, page, units=3):
    return dict(code=code, title=title, pre=pre, units=units, los=los, mode="lo", codes=codes_per_lo, page=page)

ALLD = ['D'] * 10

COURSES = [
 C("CC101", "Introduction to Computing", "None",
   ["Explain fundamental principles, concepts and evolution of computing systems as they relate to different fields",
    "Expound on the recent developments in the different computing knowledge areas",
    "Analyze solutions employed by organizations to address different computing issues"],
   row({1: 'I', 6: 'I', 9: 'I', 10: 'I'}), "25"),
 C("CC102", "Computer Programming 1", "None",
   ["Design, implement, test, and debug a program, based on a given specification, that uses each of the following fundamental programming components: (1) primitive data types, (2) basic computation, (3) simple I/O, (4) conditional and iterative structures, (5) definition of functions and parameter passing, and (6) recursion",
    "Analyze and simulate results of algorithms that may be implemented as a solution to a given problem"],
   seq('I', [1, 2, 3, 4, 5]), "26"),
 C("CC103", "Computer Programming 2", "CC102",
   ["Design, implement, test, and debug a program, based on a given specification, that uses: (1) data structures arrays, stacks, queues, trees, strings, structures, linked list, and files, (2) conditional, iterative, and recursive constructs, and (3) standard libraries in the assigned programming language"],
   seq('I', [1, 2, 3, 4, 5]), "26"),
 L("CC104", "Data Structures and Algorithms Analysis", "CC103",
   ["Design, implement, test and debug a program based on a given specifications that uses and implement abstract data types (stacks, queues, priority queues, sets, maps)",
    "Argue strengths and weaknesses among multiple implementations for a problem (e.g. on the aspects of iterative or recursive solutions and on the aspects of abstraction, encapsulation and information hiding)"],
   [seq('E', [1, 2, 4]), seq('E', [1, 2, 4])], "26"),
 C("CC105", "Information Management", "CC104",
   ["Integrate business intelligence functions in the development of database systems in enterprises"],
   row({1: 'E', 2: 'E', 3: 'E', 4: 'I', 5: 'I', 6: 'E'}), "26"),
 C("CC106", "Application Development and Emerging Technologies", "4th Year Standing",
   ["Develop specifications for a software development effort that precisely articulates the functional requirements, expected execution paths, and the explicit use of cutting edge or emerging technologies, which includes hardware devices and software library APIs.",
    "Select and use a defined coding, documentation writing, and licensing standards in a sufficiently complex software project where coding idioms and mechanisms for implementing designs to achieve desired properties such as reliability, efficiency, and robustness are practiced with respect to legal and ethical considerations",
    "Undertake, as part of a team activity an inspection of the source code and unit testing of the functional units of a sufficiently complex software project"],
   row({1: 'E', 2: 'E', 3: 'E', 4: 'D', 5: 'D', 6: 'D'}), "26"),
 C("IS101", "Fundamentals of IS", "CC101",
   ["Compare and identify the major technologies and applications of information systems in driving development and changes in enterprises"],
   seq('I', [1, 2, 3, 4, 5, 6]), "26"),
 C("IS102", "Professional Issues in IS", "CC101",
   ["Examine professional, ethical and moral challenges in computing and use of information systems and recommend courses of action.",
    "Apply/exhibit ethical thinking skills in analyzing and finding resolutions to computing issues"],
   row({8: 'E', 9: 'D', 10: 'E'}), "26"),
 C("IS103", "IT Infrastructure and Network Technologies", "CC101",
   ["Evaluate how IT infrastructure components are organized into infrastructure solutions in different organizational environments",
    "Examine, test and evaluation web solutions as applied to business enterprise"],
   row({1: 'D', 2: 'E', 3: 'E', 4: 'E', 5: 'D'}), "26-27"),
 L("IS104", "Systems Analysis and Design", "2nd Year Standing",
   ["Use systems thinking to analyze business processes and identify problems and opportunites that can be solved and supported by technology solutions",
    "Apply appropriate tools, methods, models/techniques in systems analysis and design",
    "Develop and defend a project design proposal to different audiences."],
   [row({1: 'D', 2: 'D', 6: 'E'}),
    row({1: 'E', 2: 'E', 3: 'E', 4: 'E', 5: 'D', 6: 'D', 7: 'E'}),
    row({3: 'D', 4: 'D', 5: 'E', 6: 'D', 7: 'E'})], "27"),
 C("IS105", "Enterprise Architecture", "IS103",
   ["Examine and evaluate core concepts of data/information architecture used in existing data/information architecture designs"],
   row({2: 'E', 3: 'D', 5: 'D', 6: 'D'}), "27"),
 C("IS106", "IS Project Management 1", "IS104",
   ["Examine the use of project management best practices in real-life projects",
    "Apply project management concepts, principles and tools in performing an actual IS project."],
   row({1: 'E', 2: 'E', 3: 'E', 4: 'E', 5: 'E', 6: 'E', 7: 'D', 10: 'E'}), "27"),
 L("IS107", "IS Strategy Management and Acquisition", "4th Year Standing",
   ["Examine existing and emerging information technologies, the functions of IS and how it impacts organizational operations",
    "Analyze how strategic decisions are made concerning acquiring IS resources and capabilities including the ability to evaluate the different sourcing options"],
   [row({4: 'D', 5: 'D', 6: 'D'}),
    row({2: 'D', 3: 'D', 4: 'E', 5: 'E'})], "27"),
 L("DM101", "Organization and Management Concepts", "CC101",
   ["Examine and Evaluate organizational structure policies and procedures and the information systems that support them",
    "Examine and Evaluate management lifecycle and the information systems that support them"],
   [row({1: 'I', 2: 'E', 3: 'E', 8: 'E', 9: 'E', 10: 'D'}),
    row({1: 'I', 2: 'E', 3: 'E', 8: 'E', 9: 'E', 10: 'D'})], "27"),
 C("DM102", "Financial Management", "DM101",
   ["Examine and Evaluate financial processes and reports and the information systems that support them"],
   row({1: 'E', 2: 'E', 3: 'E', 4: 'E', 5: 'E', 7: 'E'}), "27"),
 L("DM103", "Business Process Management", "DM102",
   ["Use systems thinking in modeling and analyzing business processes",
    "Rethink processes to simplify business operations"],
   [row({2: 'E', 3: 'E', 4: 'D', 5: 'D', 6: 'E'}),
    row({2: 'E', 3: 'E', 4: 'D', 5: 'D', 6: 'E'})], "27"),
 L("DM104", "Evaluation of Business Performance", "DM103",
   ["Evaluate business performance applying the different evaluation tools consistent with quality management and continuous improvement",
    "Develop quality metrics for assessment of customer satisfaction in all phases of life cycle.",
    "Design a business performance management program for SMEs"],
   [row({2: 'D', 3: 'D', 6: 'D'}),
    row({2: 'D', 3: 'D', 6: 'D'}),
    row({4: 'D', 5: 'D', 7: 'E', 8: 'E', 9: 'E'})], "27"),
 L("QUAMET", "Quantitative Methods", "3rd Year Standing",
   ["Use appropriate mathematical tools for decision making.",
    "Implement mathematical methods in IT solutions to problems."],
   [row({2: 'D', 3: 'D', 6: 'D'}),
    row({2: 'D', 3: 'D', 6: 'D'})], "27"),
 C("CAP101", "Capstone Project 1", "4th Year Standing", [], list(ALLD), "28"),
 C("CAP102", "Capstone Project 2", "4th Year Standing", [], list(ALLD), "28"),
 C("PRAC01", "Practicum", "4th Year Standing",
   ["Analyze, design, implement, test, maintain, and/or document a software system as applied to a real-world problem, as part of a team in an actual company environment, thereby also developing personal and interpersonal working skills in the process"],
   list(ALLD), "28"),
]

def as_json():
    return json.dumps(dict(pilo=[dict(code=c, attr=a, text=t) for c, a, t in PILO], courses=COURSES),
                      ensure_ascii=False)

if __name__ == "__main__":
    assert len(COURSES) == 21
    for c in COURSES:
        if c['mode'] == 'course':
            assert len(c['codes']) == 10
        else:
            assert len(c['codes']) == len(c['los']), c['code']
            assert all(len(x) == 10 for x in c['codes'])
    print("ok", len(COURSES))
