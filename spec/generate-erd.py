#!/usr/bin/env python3
"""
Generate Entity Relationship Diagram for Plugin System Database
Requires: pip install graphviz
"""

from graphviz import Digraph

def create_erd():
    # Create a new directed graph
    dot = Digraph('ER', comment='Plugin System Database Schema')
    dot.attr(rankdir='LR', size='16,10', dpi='300')
    dot.attr('node', shape='record', style='filled', fillcolor='lightblue')
    dot.attr('edge', arrowhead='crow', arrowtail='none')

    # Define table nodes with all columns
    # User table
    dot.node('User', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD COLSPAN="3" BGCOLOR="darkblue"><FONT COLOR="white"><B>USER</B></FONT></TD></TR>
            <TR><TD>PK</TD><TD>id</TD><TD>String</TD></TR>
            <TR><TD>UK</TD><TD>username</TD><TD>String</TD></TR>
            <TR><TD>UK</TD><TD>email</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>displayName</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>bio</TD><TD>String?</TD></TR>
            <TR><TD></TD><TD>avatar</TD><TD>String?</TD></TR>
            <TR><TD></TD><TD>level</TD><TD>Int</TD></TR>
            <TR><TD></TD><TD>pointsToNext</TD><TD>Int</TD></TR>
            <TR><TD></TD><TD>joinDate</TD><TD>DateTime</TD></TR>
            <TR><TD></TD><TD>createdAt</TD><TD>DateTime</TD></TR>
            <TR><TD></TD><TD>updatedAt</TD><TD>DateTime</TD></TR>
        </TABLE>
    >''')

    # Community table
    dot.node('Community', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD COLSPAN="3" BGCOLOR="darkgreen"><FONT COLOR="white"><B>COMMUNITY</B></FONT></TD></TR>
            <TR><TD>PK</TD><TD>id</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>name</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>description</TD><TD>String?</TD></TR>
            <TR><TD></TD><TD>type</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>memberCount</TD><TD>Int</TD></TR>
            <TR><TD BGCOLOR="lightyellow">FK</TD><TD BGCOLOR="lightyellow">ownerId</TD><TD BGCOLOR="lightyellow">→ User.id</TD></TR>
            <TR><TD></TD><TD>createdAt</TD><TD>DateTime</TD></TR>
            <TR><TD></TD><TD>updatedAt</TD><TD>DateTime</TD></TR>
        </TABLE>
    >''')

    # Post table
    dot.node('Post', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD COLSPAN="3" BGCOLOR="darkred"><FONT COLOR="white"><B>POST</B></FONT></TD></TR>
            <TR><TD>PK</TD><TD>id</TD><TD>String</TD></TR>
            <TR><TD BGCOLOR="lightyellow">FK</TD><TD BGCOLOR="lightyellow">authorId</TD><TD BGCOLOR="lightyellow">→ User.id</TD></TR>
            <TR><TD></TD><TD>author</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>content</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>likes</TD><TD>Int</TD></TR>
            <TR><TD></TD><TD>comments</TD><TD>Int</TD></TR>
            <TR><TD></TD><TD>isPinned</TD><TD>Boolean</TD></TR>
            <TR><TD></TD><TD>level</TD><TD>Int</TD></TR>
            <TR><TD BGCOLOR="lightyellow">FK</TD><TD BGCOLOR="lightyellow">communityId</TD><TD BGCOLOR="lightyellow">→ Community.id</TD></TR>
            <TR><TD></TD><TD>category</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>commentersCount</TD><TD>Int</TD></TR>
            <TR><TD></TD><TD>newCommentTimeAgo</TD><TD>String?</TD></TR>
            <TR><TD></TD><TD>createdAt</TD><TD>DateTime</TD></TR>
            <TR><TD></TD><TD>updatedAt</TD><TD>DateTime</TD></TR>
        </TABLE>
    >''')

    # Comment table
    dot.node('Comment', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD COLSPAN="3" BGCOLOR="purple"><FONT COLOR="white"><B>COMMENT</B></FONT></TD></TR>
            <TR><TD>PK</TD><TD>id</TD><TD>String</TD></TR>
            <TR><TD BGCOLOR="lightyellow">FK</TD><TD BGCOLOR="lightyellow">postId</TD><TD BGCOLOR="lightyellow">→ Post.id</TD></TR>
            <TR><TD BGCOLOR="lightyellow">FK</TD><TD BGCOLOR="lightyellow">authorId</TD><TD BGCOLOR="lightyellow">→ User.id</TD></TR>
            <TR><TD></TD><TD>author</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>content</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>createdAt</TD><TD>DateTime</TD></TR>
            <TR><TD></TD><TD>updatedAt</TD><TD>DateTime</TD></TR>
        </TABLE>
    >''')

    # Course table
    dot.node('Course', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD COLSPAN="3" BGCOLOR="darkorange"><FONT COLOR="white"><B>COURSE</B></FONT></TD></TR>
            <TR><TD>PK</TD><TD>id</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>title</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>description</TD><TD>String?</TD></TR>
            <TR><TD BGCOLOR="lightyellow">FK</TD><TD BGCOLOR="lightyellow">authorId</TD><TD BGCOLOR="lightyellow">→ User.id</TD></TR>
            <TR><TD BGCOLOR="lightyellow">FK</TD><TD BGCOLOR="lightyellow">communityId</TD><TD BGCOLOR="lightyellow">→ Community.id</TD></TR>
            <TR><TD></TD><TD>createdAt</TD><TD>DateTime</TD></TR>
            <TR><TD></TD><TD>updatedAt</TD><TD>DateTime</TD></TR>
            <TR><TD></TD><TD>lastSaved</TD><TD>DateTime</TD></TR>
        </TABLE>
    >''')

    # Module table
    dot.node('Module', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD COLSPAN="3" BGCOLOR="brown"><FONT COLOR="white"><B>MODULE</B></FONT></TD></TR>
            <TR><TD>PK</TD><TD>id</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>title</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>description</TD><TD>String?</TD></TR>
            <TR><TD BGCOLOR="lightyellow">FK</TD><TD BGCOLOR="lightyellow">courseId</TD><TD BGCOLOR="lightyellow">→ Course.id</TD></TR>
            <TR><TD></TD><TD>order</TD><TD>Int</TD></TR>
            <TR><TD></TD><TD>createdAt</TD><TD>DateTime</TD></TR>
            <TR><TD></TD><TD>updatedAt</TD><TD>DateTime</TD></TR>
        </TABLE>
    >''')

    # Lesson table
    dot.node('Lesson', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD COLSPAN="3" BGCOLOR="teal"><FONT COLOR="white"><B>LESSON</B></FONT></TD></TR>
            <TR><TD>PK</TD><TD>id</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>title</TD><TD>String</TD></TR>
            <TR><TD></TD><TD>content</TD><TD>String?</TD></TR>
            <TR><TD></TD><TD>type</TD><TD>String</TD></TR>
            <TR><TD BGCOLOR="lightyellow">FK</TD><TD BGCOLOR="lightyellow">moduleId</TD><TD BGCOLOR="lightyellow">→ Module.id</TD></TR>
            <TR><TD></TD><TD>order</TD><TD>Int</TD></TR>
            <TR><TD></TD><TD>duration</TD><TD>Int?</TD></TR>
            <TR><TD></TD><TD>isCompleted</TD><TD>Boolean</TD></TR>
            <TR><TD></TD><TD>createdAt</TD><TD>DateTime</TD></TR>
            <TR><TD></TD><TD>updatedAt</TD><TD>DateTime</TD></TR>
        </TABLE>
    >''')

    # PostLike junction table
    dot.node('PostLike', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD COLSPAN="3" BGCOLOR="gray"><FONT COLOR="white"><B>POSTLIKE</B></FONT></TD></TR>
            <TR><TD BGCOLOR="lightgreen">PK/FK</TD><TD BGCOLOR="lightgreen">postId</TD><TD BGCOLOR="lightgreen">→ Post.id</TD></TR>
            <TR><TD BGCOLOR="lightgreen">PK/FK</TD><TD BGCOLOR="lightgreen">userId</TD><TD BGCOLOR="lightgreen">→ User.id</TD></TR>
            <TR><TD></TD><TD>createdAt</TD><TD>DateTime</TD></TR>
        </TABLE>
    >''')

    # Add edges (relationships)
    # User relationships
    dot.edge('Community', 'User', label='ownerId', fontsize='10', color='blue')
    dot.edge('Post', 'User', label='authorId', fontsize='10', color='blue')
    dot.edge('Comment', 'User', label='authorId', fontsize='10', color='blue')
    dot.edge('Course', 'User', label='authorId', fontsize='10', color='blue')
    dot.edge('PostLike', 'User', label='userId', fontsize='10', color='green')

    # Community relationships
    dot.edge('Post', 'Community', label='communityId', fontsize='10', color='blue')
    dot.edge('Course', 'Community', label='communityId', fontsize='10', color='blue')

    # Post relationships
    dot.edge('Comment', 'Post', label='postId', fontsize='10', color='blue')
    dot.edge('PostLike', 'Post', label='postId', fontsize='10', color='green')

    # Course relationships
    dot.edge('Module', 'Course', label='courseId', fontsize='10', color='blue')

    # Module relationships
    dot.edge('Lesson', 'Module', label='moduleId', fontsize='10', color='blue')

    # Render the diagram
    dot.render('database-erd', directory='spec', format='png', cleanup=True)
    print("ERD generated successfully: spec/database-erd.png")

if __name__ == "__main__":
    create_erd()