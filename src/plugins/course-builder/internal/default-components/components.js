// Internal Default Components Export
// This file is NOT exposed in the public API
import { CourseEditor } from './CourseEditor';
import { CourseViewer } from './CourseViewer';
import { CourseList } from './CourseList';
import { CreateCourseForm } from './CreateCourseForm';
import { CourseCard } from './CourseCard';
import { CourseDetails } from './CourseDetails';
// UI Components
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Select } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
export const components = {
    // Main Components
    CourseEditor,
    CourseViewer,
    CourseList,
    CreateCourseForm,
    CourseCard,
    CourseDetails,
    // UI Components
    ui: {
        Badge,
        Button,
        Card: Card,
        Dialog: Dialog,
        Input,
        Progress,
        Select: Select,
        Switch,
        Tabs: Tabs,
        Textarea,
    },
};
// Export individual components for internal use only
export { CourseEditor, CourseViewer, CourseList, CreateCourseForm, CourseCard, CourseDetails, Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Progress, Select, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, };
